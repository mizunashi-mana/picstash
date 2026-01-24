import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createImageAttribute,
  deleteImageAttribute,
  fetchImageAttributes,
  fetchSuggestedAttributes,
  updateImageAttribute,
  type AttributeSuggestion,
} from '@/features/gallery/api';
import { fetchLabels } from '@/features/labels';
import { ImageAttributeSectionView } from './ImageAttributeSectionView';
import type { ImageAttribute } from '@picstash/api';

interface ImageAttributeSectionProps {
  imageId: string;
}

export function ImageAttributeSection({ imageId }: ImageAttributeSectionProps) {
  const queryClient = useQueryClient();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<ImageAttribute | null>(null);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addingSuggestionId, setAddingSuggestionId] = useState<string | null>(null);

  // Fetch attributes for this image
  const {
    data: attributes,
    isLoading: attributesLoading,
    error: attributesError,
  } = useQuery({
    queryKey: ['imageAttributes', imageId],
    queryFn: async () => await fetchImageAttributes(imageId),
  });

  // Fetch all labels for the dropdown
  const {
    data: labels,
    isLoading: labelsLoading,
    error: labelsError,
  } = useQuery({
    queryKey: ['labels'],
    queryFn: fetchLabels,
  });

  // Fetch suggested attributes (only when panel is open)
  const {
    data: suggestions,
    isLoading: suggestionsLoading,
    error: suggestionsError,
    refetch: refetchSuggestions,
  } = useQuery({
    queryKey: ['suggestedAttributes', imageId],
    queryFn: async () => await fetchSuggestedAttributes(imageId, { limit: 10 }),
    enabled: showSuggestions,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (selectedLabelId === null) throw new Error('Label is required');
      const trimmedKeywords = keywords
        .map(k => k.trim())
        .filter(k => k !== '');
      return await createImageAttribute(imageId, {
        labelId: selectedLabelId,
        keywords: trimmedKeywords.length > 0 ? trimmedKeywords.join(',') : undefined,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['imageAttributes', imageId] });
      setAddModalOpen(false);
      setSelectedLabelId(null);
      setKeywords([]);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (editingAttribute === null) throw new Error('No attribute selected');
      const trimmedKeywords = keywords
        .map(k => k.trim())
        .filter(k => k !== '');
      return await updateImageAttribute(imageId, editingAttribute.id, {
        keywords: trimmedKeywords.length > 0 ? trimmedKeywords.join(',') : undefined,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['imageAttributes', imageId] });
      setEditingAttribute(null);
      setKeywords([]);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (attributeId: string) => {
      setDeletingId(attributeId);
      await deleteImageAttribute(imageId, attributeId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['imageAttributes', imageId] });
      setDeletingId(null);
    },
    onError: () => {
      setDeletingId(null);
    },
  });

  // Add suggestion mutation
  const addSuggestionMutation = useMutation({
    mutationFn: async (suggestion: AttributeSuggestion) => {
      setAddingSuggestionId(suggestion.labelId);
      return await createImageAttribute(imageId, {
        labelId: suggestion.labelId,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['imageAttributes', imageId] });
      await refetchSuggestions();
      setAddingSuggestionId(null);
    },
    onError: () => {
      setAddingSuggestionId(null);
    },
  });

  // Get labels that are not already assigned
  const availableLabels = labels?.filter(
    label => attributes?.some(attr => attr.labelId === label.id) !== true,
  ) ?? [];

  const labelOptions = availableLabels.map(label => ({
    value: label.id,
    label: label.name,
  }));

  // Filter suggestions to exclude already assigned labels
  const filteredSuggestions = suggestions?.suggestions.filter(
    s => attributes?.some(attr => attr.labelId === s.labelId) !== true,
  ) ?? [];

  const openAddModal = () => {
    setSelectedLabelId(null);
    setKeywords([]);
    setAddModalOpen(true);
  };

  const closeAddModal = () => {
    setAddModalOpen(false);
    setSelectedLabelId(null);
    setKeywords([]);
  };

  const openEditModal = (attribute: ImageAttribute) => {
    setEditingAttribute(attribute);
    setKeywords(
      attribute.keywords
        ?.split(',')
        .map(k => k.trim())
        .filter(k => k !== '') ?? [],
    );
  };

  const closeEditModal = () => {
    setEditingAttribute(null);
    setKeywords([]);
  };

  return (
    <ImageAttributeSectionView
      attributes={attributes}
      labelOptions={labelOptions}
      isLoading={attributesLoading || labelsLoading}
      attributesError={attributesError}
      labelsError={labelsError}
      addModalOpen={addModalOpen}
      editingAttribute={editingAttribute}
      selectedLabelId={selectedLabelId}
      keywords={keywords}
      isCreating={createMutation.isPending}
      isUpdating={updateMutation.isPending}
      isDeletingId={deletingId}
      hasAvailableLabels={availableLabels.length > 0}
      onOpenAddModal={openAddModal}
      onCloseAddModal={closeAddModal}
      onOpenEditModal={openEditModal}
      onCloseEditModal={closeEditModal}
      onSelectedLabelIdChange={setSelectedLabelId}
      onKeywordsChange={setKeywords}
      onCreate={() => { createMutation.mutate(); }}
      onUpdate={() => { updateMutation.mutate(); }}
      onDelete={(attributeId) => { deleteMutation.mutate(attributeId); }}
      // Suggestion props
      showSuggestions={showSuggestions}
      suggestions={filteredSuggestions}
      suggestionsLoading={suggestionsLoading}
      suggestionsError={suggestionsError}
      addingSuggestionId={addingSuggestionId}
      onToggleSuggestions={() => { setShowSuggestions(!showSuggestions); }}
      onAddSuggestion={(suggestion) => { addSuggestionMutation.mutate(suggestion); }}
    />
  );
}
