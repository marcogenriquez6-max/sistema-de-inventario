import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SearchService, SearchResults } from './search.service';

@ApiTags('Búsqueda global')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Búsqueda global en productos, clientes, proveedores, empleados y ventas' })
  @ApiQuery({ name: 'q', required: true, description: 'Término de búsqueda' })
  @ApiQuery({ name: 'limit', required: false, example: 8 })
  async search(
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ): Promise<SearchResults> {
    const n = limit ? Math.min(Math.max(parseInt(limit, 10) || 8, 1), 25) : 8;
    return this.searchService.search(q ?? '', n);
  }
}
