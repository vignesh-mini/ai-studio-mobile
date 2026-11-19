import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon, type IconName } from '../components/Icon';
import { ChatScreen } from '../screens/Chat/ChatScreen';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { ImageStudioScreen } from '../screens/ImageStudio/ImageStudioScreen';
import { LibraryScreen } from '../screens/Library/LibraryScreen';
import { VideoStudioScreen } from '../screens/VideoStudio/VideoStudioScreen';
import { colors } from '../theme';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const icons: Record<keyof TabParamList, [IconName, IconName]> = {
  Home: ['home', 'home-outline'],
  Chat: ['chatbubbles', 'chatbubbles-outline'],
  Images: ['image', 'image-outline'],
  Videos: ['videocam', 'videocam-outline'],
  Library: ['albums', 'albums-outline'],
};

type TabIconProps = { focused: boolean; color: string; size: number };

const tabIcon =
  (name: keyof TabParamList) =>
  ({ focused, color, size }: TabIconProps) =>
    <Icon name={icons[name][focused ? 0 : 1]} size={size} color={color} />;

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarIcon: tabIcon(route.name),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Images" component={ImageStudioScreen} />
      <Tab.Screen name="Videos" component={VideoStudioScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
    </Tab.Navigator>
  );
}
