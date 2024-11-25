import 'package:flutter/material.dart';
import 'package:flutter_eval/flutter_eval.dart';
import 'dart:js' as js;

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        body: Container(
          width: double.infinity,
          height: double.infinity,
          color: Colors.white,
          child: const RenderFlutterWidget(),
        ),
      ),
    );
  }
}

class RenderFlutterWidget extends StatefulWidget {
  const RenderFlutterWidget({super.key});

  @override
  State<RenderFlutterWidget> createState() => _RenderFlutterWidgetState();
}

class _RenderFlutterWidgetState extends State<RenderFlutterWidget> {
  String renderingWidgetTree = """
    SizedBox()
  """;
  @override
  void initState() {
    super.initState();
  }

  String getFlutterWidgetString() {
    String flutterWidgetString = '''
      import 'package:flutter/material.dart';

      class MyApp extends StatelessWidget {
        const MyApp({super.key});

        @override
        Widget build(BuildContext context) {
          return MaterialApp(
            home: const MyHomePage(),
            debugShowCheckedModeBanner: false,
          );
        }
      }

      class MyHomePage extends StatefulWidget {
        const MyHomePage({Key? key}) : super(key: key);

        @override
        State<MyHomePage> createState() => _MyHomePageState();
      }

      class _MyHomePageState extends State<MyHomePage> {
        @override
        Widget build(BuildContext context) {
          return Scaffold(
            body: SizedBox(
              child:$renderingWidgetTree
            ),
          );
        }
      }
    ''';
    return flutterWidgetString;
  }

  @override
  Widget build(BuildContext context) {
    return RunFlutterCodeWithString(
      flutterWidgetString: getFlutterWidgetString(),
    );
  }
}

// ignore: must_be_immutable
class RunFlutterCodeWithString extends StatelessWidget {
  String flutterWidgetString = "";
  RunFlutterCodeWithString({
    super.key,
    required this.flutterWidgetString,
  });

  @override
  Widget build(BuildContext context) {
    return CompilerWidget(
      packages: {
        'example': {
          'main.dart': '''
            $flutterWidgetString
           '''
        }
      },
      library: 'package:example/main.dart',
      function: 'MyApp.',
      onError: (context, error, stackTrace) {
        return Text("Error Came $error");
      },
      args: [null],
    );
  }
}
