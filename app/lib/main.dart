import 'package:flutter/material.dart';
import 'package:flutter_custom_tabs/flutter_custom_tabs.dart';
import 'package:go_router/go_router.dart';

void main() {
  runApp(const MyApp());
}

final _router = GoRouter(
  initialLocation: '/login',
  routes: [
    GoRoute(
      path: '/accept',
      builder: (context, state) => Home(token: state.queryParams['token']), 
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => Login()
    ),
  ],
);

class MyApp extends StatelessWidget {
  const MyApp();

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      routerConfig: _router,
    );
  }
}

class Login extends StatelessWidget {
  const Login();

  @override
  Widget build(BuildContext context) {
    return MaterialApp(home: Scaffold(body: Center(child: TextButton(child: Text("Login"), onPressed: () => _login(context)))));
  }

  void _login(BuildContext context) async {
    try {
      await launch(
        'http://164.8.230.207:8080/login',
        customTabsOption: CustomTabsOption(
          toolbarColor: Theme.of(context).primaryColor,
          enableDefaultShare: true,
          //enableUrlBarHiding: true,
          showPageTitle: true,
          extraCustomTabs: const <String>[
            'org.mozilla.firefox',
            'com.microsoft.emmx',
          ],
        ),                    
        safariVCOption: SafariViewControllerOption(
            preferredBarTintColor: Theme.of(context).primaryColor,
            preferredControlTintColor: Colors.white,
            //barCollapsingEnabled: true,
            entersReaderIfAvailable: false,
            dismissButtonStyle: SafariViewControllerDismissButtonStyle.close,        
        ),
      );
    } catch (e) {
      debugPrint(e.toString());
    }
  }
}

class Home extends StatelessWidget {
  final String? token;
  const Home({this.token});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(home: Scaffold(body: Center(child: Text(token ?? 'NO TOKEN'))));
  }
}
