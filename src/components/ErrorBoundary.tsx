import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing, typography } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function ErrorBoundaryFallback({
  error,
  onReset,
}: {
  error: Error | null;
  onReset: () => void;
}) {
  const t = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: t.colors.background }]}>
      <View style={styles.icon}>
        <Ionicons name="warning-outline" size={48} color={t.colors.warning} />
      </View>
      <Text style={[styles.title, { color: t.colors.text }]}>Something went wrong</Text>
      <Text style={[styles.message, { color: t.colors.textMuted }]}>
        {error?.message ?? 'An unexpected error occurred.'}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Try again"
        onPress={onReset}
        style={[styles.button, { backgroundColor: t.colors.primary }]}
      >
        <Text style={[styles.buttonText, { color: t.colors.surface }]}>Try Again</Text>
      </Pressable>
    </View>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.button,
    paddingHorizontal: 32,
    marginTop: spacing.xl,
  },
  buttonText: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  icon: {
    marginBottom: spacing.lg,
  },
  message: {
    fontSize: typography.callout,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 21,
  },
  title: {
    fontSize: typography.heading,
    fontWeight: '800',
  },
});
