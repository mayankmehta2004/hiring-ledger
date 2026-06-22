// ============================================================
// AutoSuggestInput — Text input with auto-suggestions
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Spacing, BorderRadius, Typography } from '../../constants/theme';
import {
  getWorkTypeSuggestions,
  WorkTypeSuggestion,
} from '../../database/workTypeSuggestions';

interface AutoSuggestInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
}

export default function AutoSuggestInput({
  label,
  placeholder,
  value,
  onChangeText,
  error,
}: AutoSuggestInputProps) {
  const theme = useTheme();
  const [suggestions, setSuggestions] = useState<WorkTypeSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const loadSuggestions = useCallback(async (query: string) => {
    try {
      const results = await getWorkTypeSuggestions(query);
      setSuggestions(results);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadSuggestions(value);
      setShowSuggestions(true);
    }
  }, [value, isFocused, loadSuggestions]);

  const handleFocus = () => {
    setIsFocused(true);
    loadSuggestions(value);
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow tap to register
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
    }, 200);
  };

  const selectSuggestion = (suggestion: WorkTypeSuggestion) => {
    onChangeText(suggestion.value);
    setShowSuggestions(false);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.inputBg,
            borderColor: isFocused ? theme.primary : theme.inputBorder,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder={placeholder}
          placeholderTextColor={theme.placeholder}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCapitalize="words"
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={() => onChangeText('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={theme.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <View
          style={[
            styles.suggestionsContainer,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          {suggestions.slice(0, 6).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.suggestionItem,
                { borderBottomColor: theme.borderLight },
              ]}
              onPress={() => selectSuggestion(item)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="time-outline"
                size={16}
                color={theme.textTertiary}
                style={styles.suggestionIcon}
              />
              <Text
                style={[styles.suggestionText, { color: theme.text }]}
                numberOfLines={1}
              >
                {item.value}
              </Text>
              <Text
                style={[styles.usageCount, { color: theme.textTertiary }]}
              >
                ×{item.usage_count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {error && (
        <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
    zIndex: 10,
  },
  label: {
    ...Typography.label,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  input: {
    flex: 1,
    ...Typography.body,
    paddingVertical: Spacing.sm + 2,
  },
  suggestionsContainer: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
  },
  suggestionIcon: {
    marginRight: Spacing.sm,
  },
  suggestionText: {
    ...Typography.bodySm,
    flex: 1,
  },
  usageCount: {
    ...Typography.caption,
    marginLeft: Spacing.sm,
  },
  error: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
});
