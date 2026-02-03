import { useState } from 'react';
import {
  ActionIcon,
  Autocomplete,
  Group,
  Text,
  type AutocompleteProps,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconClock, IconSearch, IconTag, IconX } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteSearchHistory,
  fetchSearchSuggestions,
  type SearchSuggestion,
} from '@/features/search-images/api/search';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const MIN_QUERY_LENGTH = 1;
const DEBOUNCE_MS = 300;

export function SearchBar({ value, onChange }: SearchBarProps) {
  // Track the previous prop value to detect external changes (e.g., URL navigation)
  const [prevValue, setPrevValue] = useState(value);
  const [inputValue, setInputValue] = useState(value);
  const queryClient = useQueryClient();

  // Debounced value for suggestions query only
  const [debouncedInputForSuggestions] = useDebouncedValue(inputValue, DEBOUNCE_MS);

  // Sync from parent (render-time pattern)
  // Handles browser back/forward, URL changes, etc.
  if (value !== prevValue) {
    setPrevValue(value);
    setInputValue(value);
  }

  // Handle user typing - only update local state, don't notify parent
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
  };

  // Handle search submission (button click or Enter key)
  const handleSubmit = () => {
    if (inputValue !== value) {
      setPrevValue(inputValue);
      onChange(inputValue);
    }
  };

  // Handle clear button - immediate notification
  const handleClear = () => {
    setInputValue('');
    setPrevValue('');
    onChange('');
  };

  // Handle option selection - immediate notification
  const handleOptionSubmit = (selectedValue: string) => {
    setInputValue(selectedValue);
    setPrevValue(selectedValue);
    onChange(selectedValue);
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // Fetch suggestions when input changes (using debounced value)
  const suggestionsQuery = useQuery({
    queryKey: ['search-suggestions', debouncedInputForSuggestions],
    queryFn: async () => await fetchSearchSuggestions(debouncedInputForSuggestions),
    enabled: debouncedInputForSuggestions.length >= MIN_QUERY_LENGTH,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Delete history mutation
  const deleteHistoryMutation = useMutation({
    mutationFn: deleteSearchHistory,
    onSuccess: () => {
      // Invalidate suggestions to refresh the list
      void queryClient.invalidateQueries({ queryKey: ['search-suggestions'] });
    },
  });

  // Map suggestions to a lookup table for rendering
  const suggestionMap = new Map<string, SearchSuggestion>();
  for (const suggestion of suggestionsQuery.data?.suggestions ?? []) {
    suggestionMap.set(suggestion.value, suggestion);
  }

  // Convert suggestions to Autocomplete options (just values)
  const autocompleteData = (suggestionsQuery.data?.suggestions ?? []).map(
    suggestion => suggestion.value,
  );

  const renderOption: AutocompleteProps['renderOption'] = ({ option }) => {
    const suggestion = suggestionMap.get(option.value);
    const suggestionType = suggestion?.type ?? 'keyword';
    const historyId = suggestion?.id;

    const getIcon = () => {
      switch (suggestionType) {
        case 'history':
          return (
            <IconClock
              size={14}
              style={{ color: 'var(--mantine-color-orange-6)' }}
            />
          );
        case 'label':
          return (
            <IconTag
              size={14}
              style={{ color: 'var(--mantine-color-blue-6)' }}
            />
          );
        default:
          return (
            <IconSearch
              size={14}
              style={{ color: 'var(--mantine-color-gray-6)' }}
            />
          );
      }
    };

    const getTypeLabel = () => {
      switch (suggestionType) {
        case 'history':
          return '履歴';
        case 'label':
          return 'ラベル';
        default:
          return 'キーワード';
      }
    };

    const handleDeleteHistory = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (historyId !== undefined) {
        deleteHistoryMutation.mutate(historyId);
      }
    };

    return (
      <Group gap="xs" justify="space-between" wrap="nowrap" w="100%">
        <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          {getIcon()}
          <Text size="sm" truncate>
            {option.value}
          </Text>
          <Text size="xs" c="dimmed">
            {getTypeLabel()}
          </Text>
        </Group>
        {suggestionType === 'history' && historyId !== undefined && (
          <ActionIcon
            size="xs"
            variant="subtle"
            color="gray"
            radius="xs"
            onClick={handleDeleteHistory}
            aria-label="履歴を削除"
          >
            <IconX size={14} />
          </ActionIcon>
        )}
      </Group>
    );
  };

  return (
    <Group gap="xs" wrap="nowrap">
      <Autocomplete
        placeholder="検索..."
        value={inputValue}
        onChange={handleInputChange}
        onOptionSubmit={handleOptionSubmit}
        onKeyDown={handleKeyDown}
        leftSection={<IconSearch size={16} />}
        rightSection={
          inputValue !== ''
            ? (
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={handleClear}
                  aria-label="検索をクリア"
                >
                  <IconX size={16} />
                </ActionIcon>
              )
            : null
        }
        data={autocompleteData}
        renderOption={renderOption}
        limit={10}
        style={{ flex: 1 }}
      />
      <ActionIcon
        size="lg"
        variant="filled"
        onClick={handleSubmit}
        aria-label="検索"
      >
        <IconSearch size={18} />
      </ActionIcon>
    </Group>
  );
}
