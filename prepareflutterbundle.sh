# rm -rf flutter_build/

# mkdir flutter_build

cd flutterapp

flutter clean && flutter pub get && flutter build web --release

# mv build/ ../flutter_build
