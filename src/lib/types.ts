export type MediaType = 'movie' | 'tv'

export interface Summary {
  id: number
  mediaType: MediaType
  title: string
  year: string
  posterUrl: string | null
  backdropUrl: string | null
  genreIds: number[]
}

export interface Details extends Summary {
  overview: string
  runtimeMin: number | null
  certification: string | null
  genres: string[]
  director: string | null
  cast: string[]
  trailerYoutubeKey: string | null
  images: string[]
  providers: { name: string; logoUrl: string }[]
}
