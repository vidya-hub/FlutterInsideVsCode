import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "flutter.openWebview",
    () => {
      createFlutterWebview(context);
    }
  );

  context.subscriptions.push(disposable);
}

function createFlutterWebview(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    "flutterWebview",
    "Open Api Dash",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(
          path.join(context.extensionPath, "flutterapp", "build", "web")
        ),
      ],
      retainContextWhenHidden: true,
    }
  );

  const webBuildPath = getFlutterWebBuildPath(context.extensionPath);

  if (!fs.existsSync(webBuildPath)) {
    vscode.window.showErrorMessage(
      'Flutter web build not found. Please run "flutter build web" first.'
    );
    return;
  }

  panel.webview.html = getWebviewContent(panel.webview, webBuildPath);

  panel.webview.onDidReceiveMessage(
    (message) => handleWebviewMessage(message),
    undefined,
    context.subscriptions
  );
}

function getFlutterWebBuildPath(extensionPath: string): string {
  return path.join(extensionPath, "flutterapp", "build", "web");
}

function getWebviewContent(
  webview: vscode.Webview,
  webBuildPath: string
): string {
  const mainJsUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(webBuildPath, "main.dart.js"))
  );
  const flutterJsUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(webBuildPath, "flutter.js"))
  );
  const baseUri = webview.asWebviewUri(vscode.Uri.file(webBuildPath));
  const nonce = generateNonce();

  return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${webview.cspSource} 'unsafe-eval'; connect-src ${webview.cspSource} https:; img-src ${webview.cspSource} https: data:; font-src ${webview.cspSource};">
            <title>Flutter App</title>
            <base href="${baseUri}/">
            <script nonce="${nonce}" src="${flutterJsUri}"></script>
            <script nonce="${nonce}" src="${mainJsUri}" defer></script>
            <style>
                body, html {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                }
                #flutter_target {
                    width: 100%;
                    height: 100%;
                }
            </style>
        </head>
        <body>
            <div id="flutter_target"></div>
            <script nonce="${nonce}">
                const vscode = acquireVsCodeApi();
                window.addEventListener('message', event => {
                    vscode.postMessage(event.data);
                });
            </script>
        </body>
        </html>
    `;
}

function handleWebviewMessage(message: any) {
  switch (message.command) {
    case "alert":
      vscode.window.showInformationMessage(message.text);
      break;
    default:
      console.warn("Unknown command received from webview:", message.command);
  }
}

function generateNonce(): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 32 }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join("");
}

export function deactivate() {}
