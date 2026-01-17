import { useEffect, useState } from 'react';
import { ActionIcon, Autocomplete, Group, Text } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch, IconTag, IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { fetchSearchSuggestions } from '@/features/gallery/api';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
}

const MIN_QUERY_LENGTH = 1;

export function SearchBar({ value, onChange, isLoading }: SearchBarProps) {
  const [inputValue, setInputValue] = useState(value);
  const [debouncedValue] = useDebouncedValue(inputValue, 300);

  // Fetch suggestions when input changes
  const suggestionsQuery = useQuery({
    queryKey: ['search-suggestions', debouncedValue],
    queryFn: async () => await fetchSearchSuggestions(debouncedValue),
    enabled: debouncedValue.length >= MIN_QUERY_LENGTH,
    staleTime: 30000, // Cache for 30 seconds
  });

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onChange is stable from parent
  }, [debouncedValue, value]);

  const handleClear = () => {
    setInputValue('');
    onChange('');
  };

  const handleOptionSubmit = (selectedValue: string) => {
    setInputValue(selectedValue);
    onChange(selectedValue);
  };

  // Map suggestions to a lookup table for rendering
  const suggestionTypeMap = new Map<string, 'label' | 'keyword'>();
  for (const suggestion of suggestionsQuery.data?.suggestions ?? []) {
    suggestionTypeMap.set(suggestion.value, suggestion.type);
  }

  // Convert suggestions to Autocomplete options (just values)
  const autocompleteData = (suggestionsQuery.data?.suggestions ?? []).map(
    suggestion => suggestion.value,
  );

  return (
    <Autocomplete
      placeholder="検索..."
      value={inputValue}
      onChange={setInputValue}
      onOptionSubmit={handleOptionSubmit}
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
      disabled={isLoading}
      data={autocompleteData}
      renderOption={({ option }) => {
        const suggestionType = suggestionTypeMap.get(option.value) ?? 'keyword';
        return (
          <Group gap="xs">
            {suggestionType === 'label'
              ? <IconTag size={14} style={{ color: 'var(--mantine-color-blue-6)' }} />
              : <IconSearch size={14} style={{ color: 'var(--mantine-color-gray-6)' }} />}
            <Text size="sm">{option.value}</Text>
            <Text size="xs" c="dimmed">
              {suggestionType === 'label' ? 'ラベル' : 'キーワード'}
            </Text>
          </Group>
        );
      }}
      limit={10}
    />
  );
}
