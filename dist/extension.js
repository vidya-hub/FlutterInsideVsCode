/******/ (() => {
  // webpackBootstrap
  /******/ "use strict";
  /******/ var __webpack_modules__ = [
    /* 0 */
    /***/ function (__unused_webpack_module, exports, __webpack_require__) {
      var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              var desc = Object.getOwnPropertyDescriptor(m, k);
              if (
                !desc ||
                ("get" in desc
                  ? !m.__esModule
                  : desc.writable || desc.configurable)
              ) {
                desc = {
                  enumerable: true,
                  get: function () {
                    return m[k];
                  },
                };
              }
              Object.defineProperty(o, k2, desc);
            }
          : function (o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              o[k2] = m[k];
            });
      var __setModuleDefault =
        (this && this.__setModuleDefault) ||
        (Object.create
          ? function (o, v) {
              Object.defineProperty(o, "default", {
                enumerable: true,
                value: v,
              });
            }
          : function (o, v) {
              o["default"] = v;
            });
      var __importStar =
        (this && this.__importStar) ||
        function (mod) {
          if (mod && mod.__esModule) return mod;
          var result = {};
          if (mod != null)
            for (var k in mod)
              if (
                k !== "default" &&
                Object.prototype.hasOwnProperty.call(mod, k)
              )
                __createBinding(result, mod, k);
          __setModuleDefault(result, mod);
          return result;
        };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.activate = activate;
      exports.deactivate = deactivate;
      const vscode = __importStar(__webpack_require__(1));
      const fs = __importStar(__webpack_require__(2));
      const path = __importStar(__webpack_require__(3));
      function activate(context) {
        const disposable = vscode.commands.registerCommand(
          "flutter.openWebview",
          () => {
            const panel = vscode.window.createWebviewPanel(
              "flutterWebview",
              "Open Api Dash",
              vscode.ViewColumn.One,
              {
                enableScripts: true,
                localResourceRoots: [
                  vscode.Uri.file(
                    path.join(
                      context.extensionPath,
                      "flutterapp",
                      "build",
                      "web"
                    )
                  ),
                ],
                retainContextWhenHidden: true,
              }
            );
            // Get path to Flutter web build
            const webBuildPath = path.join(
              context.extensionPath,
              "flutterapp",
              "build",
              "web"
            );
            // Verify the build exists
            if (!fs.existsSync(webBuildPath)) {
              vscode.window.showErrorMessage(
                'Flutter web build not found. Please run "flutter build web" first.'
              );
              return;
            }
            // Get the content
            panel.webview.html = getWebviewContent(
              panel.webview,
              context.extensionPath
            );
            // Handle messages from the webview
            panel.webview.onDidReceiveMessage(
              (message) => {
                switch (message.command) {
                  case "alert":
                    vscode.window.showInformationMessage(message.text);
                    return;
                }
              },
              undefined,
              context.subscriptions
            );
          }
        );
        context.subscriptions.push(disposable);
      }
      function getWebviewContent(webview, extensionPath) {
        const webBuildPath = path.join(
          extensionPath,
          "flutterapp",
          "build",
          "web"
        );
        // Get paths to key Flutter web files
        const mainJs = webview.asWebviewUri(
          vscode.Uri.file(path.join(webBuildPath, "main.dart.js"))
        );
        const flutterJs = webview.asWebviewUri(
          vscode.Uri.file(path.join(webBuildPath, "flutter.js"))
        );
        // Create a nonce for script security
        const nonce = getNonce();
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${
              webview.cspSource
            } 'unsafe-inline'; script-src 'nonce-${nonce}' ${
          webview.cspSource
        } 'unsafe-eval'; connect-src ${webview.cspSource} https:; img-src ${
          webview.cspSource
        } https: data:; font-src ${webview.cspSource};">
            
            <title>Flutter App</title>
            <base href="${webview.asWebviewUri(
              vscode.Uri.file(webBuildPath)
            )}/">
            
            <script nonce="${nonce}">
                // Prevent history API usage
                const _historyPush = window.history.pushState;
                const _historyReplace = window.history.replaceState;
                window.history.pushState = function() {
                    // No-op to prevent errors
                };
                window.history.replaceState = function() {
                    // No-op to prevent errors
                };
                
                // Configure Flutter web
                window.flutterWebRenderer = "html";
                window.FLUTTER_WEB_AUTO_DETECT = true;
                
                // Override Flutter URL strategy
                window.addEventListener('load', function() {
                    if (window._flutter) {
                        window._flutter.loader.loadEntrypoint({
                            serviceWorker: {
                                serviceWorkerVersion: null
                            },
                            onEntrypointLoaded: async function(engineInitializer) {
                                // Intercept URL strategy before running the app
                                let originalDefineProperty = Object.defineProperty;
                                Object.defineProperty = function(obj, prop, descriptor) {
                                    if (prop === 'pushState' || prop === 'replaceState') {
                                        return obj;
                                    }
                                    return originalDefineProperty(obj, prop, descriptor);
                                };

                                const appRunner = await engineInitializer.initializeEngine({
                                    hostElement: document.querySelector('#flutter_target')
                                });
                                
                                // Restore original defineProperty
                                Object.defineProperty = originalDefineProperty;
                                
                                await appRunner.runApp();
                            }
                        });
                    }
                });
            </script>
            
            <script nonce="${nonce}" src="${flutterJs}"></script>
            <script nonce="${nonce}" src="${mainJs}" defer></script>

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
                // Handle messages to VS Code
                const vscode = acquireVsCodeApi();
                window.addEventListener('message', event => {
                    vscode.postMessage(event.data);
                });
            </script>
        </body>
        </html>
    `;
      }
      function getNonce() {
        let text = "";
        const possible =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 32; i++) {
          text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
      }
      function deactivate() {}

      /***/
    },
    /* 1 */
    /***/ (module) => {
      module.exports = require("vscode");

      /***/
    },
    /* 2 */
    /***/ (module) => {
      module.exports = require("fs");

      /***/
    },
    /* 3 */
    /***/ (module) => {
      module.exports = require("path");

      /***/
    },
    /******/
  ];
  /************************************************************************/
  /******/ // The module cache
  /******/ var __webpack_module_cache__ = {};
  /******/
  /******/ // The require function
  /******/ function __webpack_require__(moduleId) {
    /******/ // Check if module is in cache
    /******/ var cachedModule = __webpack_module_cache__[moduleId];
    /******/ if (cachedModule !== undefined) {
      /******/ return cachedModule.exports;
      /******/
    }
    /******/ // Create a new module (and put it into the cache)
    /******/ var module = (__webpack_module_cache__[moduleId] = {
      /******/ // no module.id needed
      /******/ // no module.loaded needed
      /******/ exports: {},
      /******/
    });
    /******/
    /******/ // Execute the module function
    /******/ __webpack_modules__[moduleId].call(
      module.exports,
      module,
      module.exports,
      __webpack_require__
    );
    /******/
    /******/ // Return the exports of the module
    /******/ return module.exports;
    /******/
  }
  /******/
  /************************************************************************/
  /******/
  /******/ // startup
  /******/ // Load entry module and return exports
  /******/ // This entry module is referenced by other modules so it can't be inlined
  /******/ var __webpack_exports__ = __webpack_require__(0);
  /******/ module.exports = __webpack_exports__;
  /******/
  /******/
})();
//# sourceMappingURL=extension.js.map
