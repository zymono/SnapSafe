// Central theme for consistent styling across the app
import { Platform } from 'react-native';

export const colors = {
  // Primary palette
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#3b82f6',
  
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  
  // Neutrals
  white: '#ffffff',
  black: '#000000',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  
  // Background colors
  background: '#f3f4f6',
  backgroundLight: '#f9fafb',
  surface: '#ffffff',
  
  // Text colors
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textOnPrimary: '#ffffff',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    color: colors.textPrimary,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    color: colors.textPrimary,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    color: colors.textPrimary,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    color: colors.textPrimary,
  },
  h5: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    color: colors.textPrimary,
  },
  h6: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: colors.textPrimary,
  },
  body1: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textPrimary,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: colors.textTertiary,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: colors.textOnPrimary,
  },
};

export const shadows = {
  small: Platform.select({
    web: '0px 2px 4px rgba(0, 0, 0, 0.06)',
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
  }),
  medium: Platform.select({
    web: '0px 4px 6px rgba(0, 0, 0, 0.08)',
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4,
    },
  }),
  large: Platform.select({
    web: '0px 6px 10px rgba(0, 0, 0, 0.1)',
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 6,
    },
  }),
};

export const components = {
  // Common container styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  
  // Card styles
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.medium,
  },
  
  // Button styles
  buttonPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  
  buttonSecondary: {
    backgroundColor: colors.gray200,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonDanger: {
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  
  // Input styles
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    fontSize: 16,
    color: colors.textPrimary,
  },
  
  inputFocused: {
    borderColor: colors.primary,
    ...shadows.small,
  },
  
  // Text input with label
  inputGroup: {
    marginBottom: spacing.lg,
  },
  
  inputLabel: {
    ...typography.h6,
    marginBottom: spacing.sm,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  
  modalContent: {
    width: '100%',
    backgroundColor: colors.surface,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.xxl,
    alignItems: 'center',
    ...shadows.large,
  },
  
  // Header styles
  header: {
    ...typography.h2,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  
  // FAB (Floating Action Button)
  fab: {
    position: 'absolute',
    bottom: spacing.xxxl,
    right: spacing.xxxl,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.large,
  },
  
  // List item styles
  listItem: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.small,
  },
};

// Status-specific styles
export const statusStyles = {
  pending: {
    backgroundColor: '#fff3cd',
    borderColor: colors.warning,
    color: '#856404',
  },
  approved: {
    backgroundColor: '#d1edff',
    borderColor: colors.info,
    color: '#0c5460',
  },
  reviewed: {
    backgroundColor: '#d4edda',
    borderColor: colors.success,
    color: '#155724',
  },
  rejected: {
    backgroundColor: '#f8d7da',
    borderColor: colors.error,
    color: '#721c24',
  },
};