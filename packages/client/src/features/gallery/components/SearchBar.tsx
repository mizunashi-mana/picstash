import { useEffect, useState } from 'react';
import { ActionIcon, TextInput } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch, IconX } from '@tabler/icons-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
}

export function SearchBar({ value, onChange, isLoading }: SearchBarProps) {
  const [inputValue, setInputValue] = useState(value);
  const [debouncedValue] = useDebouncedValue(inputValue, 300);

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

  return (
    <TextInput
      placeholder="検索..."
      value={inputValue}
      onChange={e => setInputValue(e.currentTarget.value)}
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
    />
  );
}
