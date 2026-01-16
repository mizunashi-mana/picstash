import { prisma } from './prisma.js';
import type { AttributeLabel } from '@~generated/prisma/client.js';

export interface CreateLabelInput {
  name: string;
  color?: string;
}

export interface UpdateLabelInput {
  name?: string;
  color?: string;
}

/**
 * Create a new attribute label
 */
export async function createLabel(input: CreateLabelInput): Promise<AttributeLabel> {
  return await prisma.attributeLabel.create({
    data: input,
  });
}

/**
 * Find a label by ID
 */
export async function findLabelById(id: string): Promise<AttributeLabel | null> {
  return await prisma.attributeLabel.findUnique({
    where: { id },
  });
}

/**
 * Find a label by name
 */
export async function findLabelByName(name: string): Promise<AttributeLabel | null> {
  return await prisma.attributeLabel.findUnique({
    where: { name },
  });
}

/**
 * Find all labels
 */
export async function findAllLabels(): Promise<AttributeLabel[]> {
  return await prisma.attributeLabel.findMany({
    orderBy: { name: 'asc' },
  });
}

/**
 * Update a label by ID
 */
export async function updateLabelById(
  id: string,
  input: UpdateLabelInput,
): Promise<AttributeLabel> {
  return await prisma.attributeLabel.update({
    where: { id },
    data: input,
  });
}

/**
 * Delete a label by ID
 */
export async function deleteLabelById(id: string): Promise<AttributeLabel> {
  return await prisma.attributeLabel.delete({
    where: { id },
  });
}
