# Server Domain Refactoring Task

## Overview

Refactor the server package to properly separate domain logic into `src/domain` directory following Clean Architecture principles.

## Current State

### Problems Identified

1. **Domain layer is empty** - `src/domain/` exists but contains no code
2. **Entities defined as port types** - `Image`, `Label`, `ArchiveSession`, `ArchiveEntry` are defined in `application/ports/` instead of domain layer
3. **Business logic scattered in wrong layers**:
   - MIME type validation in application layer (`upload-image.ts`)
   - Label name validation in application layer (`create-label.ts`)
   - Image file detection rules in infrastructure layer (`in-memory-archive-session-manager.ts`)
   - Archive size limits in infrastructure layer

### Current File Structure

```
/src
├── application/
│   ├── archive/
│   │   └── import-from-archive.ts (MIME_TYPE_MAP here)
│   ├── image/
│   │   └── upload-image.ts (ALLOWED_MIME_TYPES here)
│   ├── label/
│   │   └── create-label.ts (name validation here)
│   ├── image-attribute/
│   └── ports/
│       ├── image-repository.ts (Image entity here)
│       ├── label-repository.ts (Label entity here)
│       ├── archive-session-manager.ts (ArchiveSession here)
│       └── archive-handler.ts (ArchiveEntry here)
├── domain/ (empty)
├── infra/
│   └── adapters/
│       └── in-memory-archive-session-manager.ts (IMAGE_EXTENSIONS, isImageFile here)
└── shared/
    └── validators/
```

## Target State

### New Domain Structure

```
/src/domain
├── image/
│   ├── Image.ts                 # Image entity
│   ├── ImageMimeType.ts         # MIME type value object with validation
│   └── index.ts
├── label/
│   ├── Label.ts                 # Label entity with name validation
│   ├── LabelName.ts             # Label name value object
│   └── index.ts
├── image-attribute/
│   ├── ImageAttribute.ts        # ImageAttribute entity
│   └── index.ts
├── archive/
│   ├── ArchiveSession.ts        # ArchiveSession value object
│   ├── ArchiveEntry.ts          # ArchiveEntry value object
│   ├── ArchiveImageDetector.ts  # Image detection logic
│   ├── ArchiveConfig.ts         # Archive configuration (max size, etc.)
│   └── index.ts
└── index.ts
```

## Implementation Plan

### Phase 1: Create Domain Entities

1. Create `ImageMimeType` value object with MIME type validation
2. Create `Image` entity that uses `ImageMimeType`
3. Create `LabelName` value object with name validation
4. Create `Label` entity that uses `LabelName`
5. Create `ImageAttribute` entity

### Phase 2: Create Archive Domain Objects

1. Create `ArchiveEntry` value object
2. Create `ArchiveSession` value object
3. Create `ArchiveImageDetector` service for detecting image files
4. Create `ArchiveConfig` for configuration constants

### Phase 3: Refactor Application Layer

1. Update `upload-image.ts` to use domain `ImageMimeType`
2. Update `create-label.ts` to use domain `Label` entity
3. Update `import-from-archive.ts` to use domain objects

### Phase 4: Update Infrastructure Layer

1. Update repository ports to re-export domain entities
2. Update `InMemoryArchiveSessionManager` to use domain objects

## Migration Strategy

- Keep backward compatibility during transition
- Re-export domain entities from ports for smooth migration
- Update one layer at a time

## Branch

`server-domain-refactor`

## Status

- [x] Phase 1: Domain Entities
- [x] Phase 2: Archive Domain Objects
- [x] Phase 3: Application Layer Refactoring
- [x] Phase 4: Infrastructure Updates
- [x] Tests pass (35 tests)
- [ ] PR created
