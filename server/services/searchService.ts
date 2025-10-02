import { db } from '../db';
import { sql } from 'drizzle-orm';

export interface SearchResult {
  id: string;
  type: 'project' | 'post';
  title: string;
  description: string;
  rank: number;
  category?: string;
  status?: string;
  createdAt?: Date;
  thumbnailUrl?: string;
  authorId?: string;
  projectId?: string;
}

export interface SearchFilters {
  query: string;
  type?: 'project' | 'post' | 'all';
  category?: string;
  language?: 'fr' | 'en' | 'es';
  limit?: number;
  offset?: number;
}

export class SearchService {
  private getLanguageConfig(language: string): string {
    const langMap: Record<string, string> = {
      'fr': 'french',
      'en': 'english',
      'es': 'spanish',
    };
    return langMap[language] || 'english';
  }

  async search(filters: SearchFilters): Promise<SearchResult[]> {
    const {
      query,
      type = 'all',
      category,
      language = 'fr',
      limit = 20,
      offset = 0,
    } = filters;

    if (!query || query.trim().length < 2) {
      return [];
    }

    const langConfig = this.getLanguageConfig(language);
    const searchQuery = query.trim();

    const results: SearchResult[] = [];

    try {
      if (type === 'project' || type === 'all') {
        const projectResults = await db.execute(sql`
          SELECT 
            id,
            'project' as type,
            title,
            description,
            category,
            status,
            created_at,
            thumbnail_url,
            creator_id as author_id,
            ts_rank(
              to_tsvector(${langConfig}, COALESCE(title, '') || ' ' || COALESCE(description, '')),
              plainto_tsquery(${langConfig}, ${searchQuery})
            ) as rank
          FROM projects
          WHERE 
            to_tsvector(${langConfig}, COALESCE(title, '') || ' ' || COALESCE(description, ''))
            @@ plainto_tsquery(${langConfig}, ${searchQuery})
            ${category ? sql`AND category = ${category}` : sql``}
            AND status IN ('active', 'pending', 'completed')
          ORDER BY rank DESC, created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `);

      results.push(...projectResults.rows.map((row: any) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        description: row.description,
        rank: parseFloat(row.rank),
        category: row.category,
        status: row.status,
        createdAt: row.created_at,
        thumbnailUrl: row.thumbnail_url,
        authorId: row.author_id,
      })));
    }

      if (type === 'post' || type === 'all') {
        const postResults = await db.execute(sql`
          SELECT 
            id,
            'post' as type,
            title,
            content as description,
            project_id,
            status,
            created_at,
            author_id,
            ts_rank(
              to_tsvector(${langConfig}, COALESCE(title, '') || ' ' || COALESCE(content, '')),
              plainto_tsquery(${langConfig}, ${searchQuery})
            ) as rank
          FROM social_posts
          WHERE 
            to_tsvector(${langConfig}, COALESCE(title, '') || ' ' || COALESCE(content, ''))
            @@ plainto_tsquery(${langConfig}, ${searchQuery})
            AND status = 'published'
          ORDER BY rank DESC, created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `);

        results.push(...postResults.rows.map((row: any) => ({
          id: row.id,
          type: row.type,
          title: row.title,
          description: row.description,
          rank: parseFloat(row.rank),
          status: row.status,
          createdAt: row.created_at,
          authorId: row.author_id,
          projectId: row.project_id,
        })));
      }

      results.sort((a, b) => b.rank - a.rank);

      return results.slice(0, limit);
    } catch (error) {
      console.error('Full-text search error:', error);
      throw new Error('Search query failed. Please try a different search term.');
    }
  }

  async getSuggestions(query: string, language: string = 'fr', limit: number = 5): Promise<string[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const escapedQuery = query.trim().replace(/[%_]/g, '\\$&');
    const searchPattern = `${escapedQuery}%`;

    try {
      const suggestions = await db.execute(sql`
        WITH combined AS (
          SELECT DISTINCT title as suggestion
          FROM projects
          WHERE title ILIKE ${searchPattern}
          UNION
          SELECT DISTINCT title as suggestion
          FROM social_posts
          WHERE title ILIKE ${searchPattern}
        )
        SELECT suggestion
        FROM combined
        ORDER BY suggestion
        LIMIT ${limit}
      `);

      return suggestions.rows.map((row: any) => row.suggestion);
    } catch (error) {
      console.error('Suggestions error:', error);
      return [];
    }
  }
}

export const searchService = new SearchService();
