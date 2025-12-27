/**
 * Enhanced Search API with Multi-Monitor Support
 * 
 * Provides search functionality with monitor filtering
 */

export interface SearchParams {
    q: string;
    content_type?: 'ocr' | 'audio' | 'all';
    monitor_id?: string; // NEW: Filter by specific monitor
    monitor_ids?: string[]; // NEW: Filter by multiple monitors
    start_time?: number;
    end_time?: number;
    app_name?: string;
    window_name?: string;
    limit?: number;
    offset?: number;
}

export interface SearchResult {
    type: 'ocr' | 'audio';
    content: string;
    timestamp: number;
    monitor_id?: string;
    monitor_name?: string;
    app_name?: string;
    window_name?: string;
    file_path?: string;
}

export interface PaginatedSearchResponse {
    data: SearchResult[];
    pagination: {
        limit: number;
        offset: number;
        total: number;
    };
}

/**
 * Search screenpipe database with optional monitor filtering
 */
export async function searchScreenpipe(params: SearchParams): Promise<PaginatedSearchResponse> {
    const searchParams = new URLSearchParams();

    // Required parameter
    searchParams.append('q', params.q);

    // Optional parameters
    if (params.content_type) {
        searchParams.append('content_type', params.content_type);
    }

    // Monitor filtering (NEW!)
    if (params.monitor_id) {
        searchParams.append('monitor_id', params.monitor_id);
    }

    if (params.monitor_ids && params.monitor_ids.length > 0) {
        params.monitor_ids.forEach(id => {
            searchParams.append('monitor_ids[]', id);
        });
    }

    if (params.start_time) {
        searchParams.append('start_time', params.start_time.toString());
    }

    if (params.end_time) {
        searchParams.append('end_time', params.end_time.toString());
    }

    if (params.app_name) {
        searchParams.append('app_name', params.app_name);
    }

    if (params.window_name) {
        searchParams.append('window_name', params.window_name);
    }

    if (params.limit) {
        searchParams.append('limit', params.limit.toString());
    }

    if (params.offset) {
        searchParams.append('offset', params.offset.toString());
    }

    const response = await fetch(`http://localhost:3030/search?${searchParams.toString()}`);

    if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Get frames for a specific time range and monitors
 */
export async function getFrames(params: {
    start_time: number;
    end_time: number;
    monitor_ids?: string[];
    limit?: number;
}): Promise<any[]> {
    const searchParams = new URLSearchParams();

    searchParams.append('start_time', params.start_time.toString());
    searchParams.append('end_time', params.end_time.toString());

    if (params.monitor_ids && params.monitor_ids.length > 0) {
        params.monitor_ids.forEach(id => {
            searchParams.append('monitor_ids[]', id);
        });
    }

    if (params.limit) {
        searchParams.append('limit', params.limit.toString());
    }

    const response = await fetch(`http://localhost:3030/frames?${searchParams.toString()}`);

    if (!response.ok) {
        throw new Error(`Get frames failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
}

/**
 * Get audio transcriptions for a specific time range and monitors
 */
export async function getAudioTranscriptions(params: {
    start_time: number;
    end_time: number;
    monitor_ids?: string[];
    limit?: number;
}): Promise<any[]> {
    const searchParams = new URLSearchParams();

    searchParams.append('start_time', params.start_time.toString());
    searchParams.append('end_time', params.end_time.toString());
    searchParams.append('content_type', 'audio');

    if (params.monitor_ids && params.monitor_ids.length > 0) {
        params.monitor_ids.forEach(id => {
            searchParams.append('monitor_ids[]', id);
        });
    }

    if (params.limit) {
        searchParams.append('limit', params.limit.toString());
    }

    const response = await fetch(`http://localhost:3030/search?${searchParams.toString()}`);

    if (!response.ok) {
        throw new Error(`Get audio failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
}
