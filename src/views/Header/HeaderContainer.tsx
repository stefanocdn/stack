import * as React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { NavigationContext, NavigationRoute } from 'react-navigation';
import { EdgeInsets } from 'react-native-safe-area-context';
import {
  Layout,
  HeaderScene,
  NavigationStackProp,
  HeaderStyleInterpolator,
} from '../../types';
import Header from './Header';
import { forStatic } from '../../TransitionConfigs/HeaderStyleInterpolators';

export type Props = {
  mode: 'float' | 'screen';
  layout: Layout;
  insets: EdgeInsets;
  scenes: Array<HeaderScene | undefined>;
  navigation: NavigationStackProp;
  getPreviousRoute: (props: {
    route: NavigationRoute;
  }) => NavigationRoute | undefined;
  onContentHeightChange?: (props: {
    route: NavigationRoute;
    height: number;
  }) => void;
  styleInterpolator: HeaderStyleInterpolator;
  style?: StyleProp<ViewStyle>;
};

export default function HeaderContainer({
  mode,
  scenes,
  layout,
  insets,
  navigation,
  getPreviousRoute,
  onContentHeightChange,
  styleInterpolator,
  style,
}: Props) {
  const focusedRoute = navigation.state.routes[navigation.state.index];

  return (
    <View pointerEvents="box-none" style={style}>
      {scenes.map((scene, i, self) => {
        if ((mode === 'screen' && i !== self.length - 1) || !scene) {
          return null;
        }

        const { options } = scene.descriptor;
        const isFocused = focusedRoute.key === scene.route.key;
        const previousRoute = getPreviousRoute({ route: scene.route });

        let previous;

        if (previousRoute) {
          // The previous scene will be shortly before the current scene in the array
          // So loop back from current index to avoid looping over the full array
          for (let j = i - 1; j >= 0; j--) {
            const s = self[j];

            if (s && s.route.key === previousRoute.key) {
              previous = s;
              break;
            }
          }
        }

        // If the screen is next to a headerless screen, we need to make the header appear static
        // This makes the header look like it's moving with the screen
        const previousScene = self[i - 1];
        const nextScene = self[i + 1];
        const isHeaderStatic =
          mode === 'float'
            ? (previousScene &&
                (previousScene.descriptor.options.header === null ||
                  previousScene.descriptor.options.headerShown === false) &&
                // We still need to animate when coming back from next scene
                // A hacky way to check this is if the next scene exists
                !nextScene) ||
              (nextScene &&
                (nextScene.descriptor.options.header === null ||
                  nextScene.descriptor.options.headerShown === false))
            : false;

        const props = {
          mode,
          layout,
          insets,
          scene,
          previous,
          navigation: scene.descriptor.navigation as NavigationStackProp,
          styleInterpolator: isHeaderStatic ? forStatic : styleInterpolator,
        };

        return (
          <NavigationContext.Provider
            key={scene.route.key}
            value={scene.descriptor.navigation}
          >
            <View
              onLayout={
                onContentHeightChange
                  ? e =>
                      onContentHeightChange({
                        route: scene.route,
                        height: e.nativeEvent.layout.height,
                      })
                  : undefined
              }
              pointerEvents={isFocused ? 'box-none' : 'none'}
              accessibilityElementsHidden={!isFocused}
              importantForAccessibility={
                isFocused ? 'auto' : 'no-hide-descendants'
              }
              style={
                mode === 'float' || options.headerTransparent
                  ? styles.header
                  : null
              }
            >
              {options.headerShown !== false ? (
                options.header !== undefined ? (
                  typeof options.header === 'function' ? (
                    options.header(props)
                  ) : (
                    options.header
                  )
                ) : (
                  <Header {...props} />
                )
              ) : null}
            </View>
          </NavigationContext.Provider>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
