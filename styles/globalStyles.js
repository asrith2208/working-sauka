import { StyleSheet } from 'react-native';

// --- DESIGN SYSTEM --- //

// 1. COLORS
export const COLORS = {
  primary: '#40916c',       // A deep, trustworthy green
  secondary: '#52b788',     // A brighter, active green
  accent: '#d8f3dc',        // Light green for backgrounds or highlights
  
  white: '#FFFFFF',
  black: '#000000',
  
  neutralGray: '#f8f9fa',  // Lightest gray for screen backgrounds
  neutralGray2: '#e9ecef', // Light gray for inputs, borders
  neutralGray3: '#ced4da', // Medium gray for icons, borders
  
  textPrimary: '#212529',   // For headings and primary text
  textSecondary: '#6c757d', // For subheadings and secondary text
  
  success: '#2d6a4f',       // Success messages, confirmation
  error: '#e63946',         // Error messages, warnings
  warning: '#ffc107',       // Non-critical warnings
};

// 2. TYPOGRAPHY
export const FONTS = {
  h1: { fontSize: 32, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 12 },
  h2: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 10 },
  h3: { fontSize: 20, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  body: { fontSize: 16, color: COLORS.textSecondary, lineHeight: 24 },
  small: { fontSize: 12, color: COLORS.textSecondary },
};

// 3. SPACING
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
};

// 4. LAYOUT & REUSABLE COMPONENT STYLES
export const globalStyles = StyleSheet.create({
  // -- LAYOUT -- //
  container: {
    flex: 1,
    backgroundColor: COLORS.neutralGray,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  // -- TYPOGRAPHY HELPERS -- //
  h1: FONTS.h1,
  h2: FONTS.h2,
  h3: FONTS.h3,
  body: FONTS.body,
  small: FONTS.small,

  // -- UI COMPONENTS -- //
  // Buttons
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2, // Android shadow
    shadowColor: COLORS.black, // iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  buttonPrimaryText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondaryText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Inputs
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.neutralGray3,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  
  // Cards
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // -- UTILITIES -- //
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
});
