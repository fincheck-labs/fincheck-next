import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { useRouter, usePathname, Href } from 'expo-router';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { useTheme } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75; // 75% of screen width

interface DrawerProps {
  visible: boolean;
  onClose: () => void;
  onThemeToggle: () => void;
}

interface NavItem {
  title: string;
  route: string;
  description?: string;
}

export function Drawer({ visible, onClose, onThemeToggle }: DrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { colors, isDark } = useTheme();
  const slideAnim = React.useRef(new Animated.Value(DRAWER_WIDTH)).current;

  const navigationItems: NavItem[] = [
    { title: 'Home', route: '/', description: 'Project overview' },
    { title: 'Upload', route: '/upload/', description: 'Upload your data' },
    { title: 'Results', route: '/results/', description: 'View all results' },
    { title: 'Digit Verify', route: '/digit-verify/', description: 'Verify digits' },
    { title: 'Image Verify', route: '/banking-demo/', description: 'Banking features' },
    { title: 'Cheque Processing', route: '/cheque/', description: 'Process cheques' },
  ];

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: DRAWER_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => {
      try {
        if (route === '/') {
          router.push('/(tabs)' as Href);
        } else {
          router.push(route as Href);
        }
      } catch (error) {
        console.error('❌ Navigation error:', error);
      }
    }, 350);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Drawer */}
        <Animated.View
          style={[
            styles.drawer,
            {
              backgroundColor: colors.background,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <ThemedText style={styles.headerTitle}>Menu</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <ThemedText style={styles.closeIcon}>✕</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Navigation Items */}
          <View style={styles.navItems}>
            {navigationItems.map((item, index) => {
              const isActive = pathname === item.route || 
                               (item.route !== '/' && pathname.startsWith(item.route));
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.navItem,
                    { 
                      borderBottomColor: colors.border,
                      backgroundColor: isActive ? colors.primary + '10' : 'transparent',
                    },
                  ]}
                  onPress={() => handleNavigate(item.route)}
                  activeOpacity={0.7}
                >
                  <View>
                    <ThemedText style={[
                      styles.navTitle,
                      isActive && { color: colors.primary, fontWeight: '700' }
                    ]}>
                      {item.title}
                    </ThemedText>
                    {item.description && (
                      <ThemedText style={[styles.navDescription, { opacity: 0.6 }]}>
                        {item.description}
                      </ThemedText>
                    )}
                  </View>
                  <ThemedText style={[styles.navArrow, { color: colors.primary }]}>
                    →
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Theme Toggle */}
          <View style={[styles.themeSection, { borderTopColor: colors.border }]}>
            <ThemedText style={styles.themeLabel}>Theme</ThemedText>
            <TouchableOpacity
              onPress={onThemeToggle}
              style={[
                styles.themeToggle,
                { backgroundColor: colors.cardBackground },
              ]}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.themeToggleThumb,
                  {
                    backgroundColor: isDark ? colors.text : colors.primary,
                    transform: [{ translateX: isDark ? 24 : 0 }],
                  },
                ]}
              />
            </TouchableOpacity>
            <ThemedText style={[styles.themeText, { opacity: 0.6 }]}>
              {isDark ? 'Dark' : 'Light'}
            </ThemedText>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <ThemedText style={[styles.footerText, { opacity: 0.5 }]}>
              CNN Model Compression Analysis
            </ThemedText>
            <ThemedText style={[styles.footerText, { opacity: 0.4, fontSize: 12 }]}>
              v1.0.0
            </ThemedText>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 24,
    fontWeight: '300',
  },
  navItems: {
    flex: 1,
    paddingTop: 8,
  },
  navItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  navDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  navArrow: {
    fontSize: 20,
    fontWeight: '600',
  },
  themeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeToggle: {
    width: 52,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  themeToggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  themeText: {
    fontSize: 14,
    minWidth: 45,
    textAlign: 'right',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 2,
  },
});