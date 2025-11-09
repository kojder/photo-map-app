package com.photomap.dto;

public record BulkDeleteResponse(
        int deletedCount,
        int totalCount,
        String message
) {
    public BulkDeleteResponse(int deletedCount, int totalCount) {
        this(deletedCount, totalCount, String.format("Successfully deleted %d orphaned photos", deletedCount));
    }
}
