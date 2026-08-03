import { SearchService, SearchResults } from './search.service';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    search(q: string, limit?: string): Promise<SearchResults>;
}
