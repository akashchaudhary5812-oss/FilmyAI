# FilmyAI ML Engine — Dataset Audit Report

> **Generated automatically via programmatic dataset inspection.**
> **Total CSV datasets inspected:** 10

---

| Dataset Name | Rows | Columns | Duplicates | Missing Cells (%) | Key Columns | Potential Target | Recommended Role |
|---|---|---|---|---|---|---|---|
| `bollywood_actress/BollywoodMovieDetail.csv` | 1,284 | 10 | 0 | 1.43% | imdbId, title, releaseYear, releaseDate... | imdbId, hitFlop | Primary Movie Metadata & Cast |
| `bollywood_movies/BollywoodActorRanking.csv` | 301 | 8 | 0 | 4.73% | actorId, actorName, movieCount, ratingSum... | ratingSum, googleHits, normalizedRating | Historical Star / Director Rankings |
| `bollywood_movies/BollywoodDirectorRanking.csv` | 118 | 8 | 0 | 0.11% | directorId, directorName, movieCount, ratingSum... | ratingSum, googleHits, normalizedRating | Historical Star / Director Rankings |
| `bollywood_movies/BollywoodMovieDetail.csv` | 1,284 | 10 | 0 | 1.43% | imdbId, title, releaseYear, releaseDate... | imdbId, hitFlop | Primary Movie Metadata & Cast |
| `imdb_ott/amazon_prime_titles.csv` | 9,668 | 12 | 0 | 19.10% | show_id, type, title, director... | rating | Metadata / Cross-platform context |
| `imdb_ott/apple.csv` | 170 | 15 | 0 | 3.29% | id, title, type, description... | imdb_id, imdb_score, imdb_votes, tmdb_score | Metadata / Cross-platform context |
| `imdb_ott/Final Bollywood.csv` | 1,321 | 8 | 0 | 0.01% | Title, Date, Genre, orig_lang... | Revenue($), score | Financial / Commercial Target & Verdict Source |
| `imdb_ott/Final Hollywood.csv` | 10,177 | 8 | 0 | 0.10% | Creed III, 02-03-2023, Drama, Action,  English... | None | Financial / Commercial Target & Verdict Source |
| `imdb_ott/hotstar.csv` | 6,874 | 7 | 12 | 4.79% | title, description, genre, year... | age_rating | Metadata / Cross-platform context |
| `imdb_ott/Netflix.csv` | 5,331 | 57 | 0 | 0.00% | type, title, director, cast... | rating, User_Rating | Metadata / Cross-platform context |

---

## Dataset: `bollywood_actress/BollywoodMovieDetail.csv`
- **Shape:** `1,284` rows × `10` columns
- **Exact Duplicates:** `0` rows
- **Overall Missingness:** `1.43%` (184 missing values)

### Column Schema & Missingness Analysis
| Column | Type | Non-Null Count | Missing (%) | Unique Values | Sample Values |
|---|---|---|---|---|---|
| `imdbId` | str | 1,284 | 0.00% | 1,284 | tt0118578, tt0169102, tt0187279 |
| `title` | str | 1,284 | 0.00% | 1,284 | Albela, Lagaan: Once Upon a Time in India, Meri Biwi Ka Jawa |
| `releaseYear` | int64 | 1,284 | 0.00% | 14 | 2001, 2004, 2002 |
| `releaseDate` | str | 1,231 | 4.13% | 710 | 20-Apr-01, 8-May-02, 2-Jul-04 |
| `genre` | str | 1,282 | 0.16% | 215 | Romance, Adventure \| Drama \| Musical, Action \| Comedy |
| `writers` | str | 1,165 | 9.27% | 1,109 | Honey Irani (screenplay) \| Honey Irani (story) \| Javed Sid |
| `actors` | str | 1,281 | 0.23% | 1,281 | Govinda \| Aishwarya Rai Bachchan \| Jackie Shroff \| Namrat |
| `directors` | str | 1,280 | 0.31% | 731 | Deepak Sareen, Ashutosh Gowariker, Pankaj Parashar \| S.M. I |
| `sequel` | float64 | 1,281 | 0.23% | 3 | 0.0, 1.0, 2.0 |
| `hitFlop` | int64 | 1,284 | 0.00% | 9 | 2, 6, 1 |

### Numerical Distributions Summary
| Column | Mean | Std | Min | 25% | 50% (Median) | 75% | Max |
|---|---|---|---|---|---|---|---|
| `releaseYear` | 2007.99 | 4.01 | 2001.00 | 2004.00 | 2008.00 | 2011.00 | 2014.00 |
| `sequel` | 0.04 | 0.19 | 0.00 | 0.00 | 0.00 | 0.00 | 2.00 |
| `hitFlop` | 2.14 | 1.81 | 1.00 | 1.00 | 1.00 | 2.00 | 9.00 |
## Dataset: `bollywood_movies/BollywoodActorRanking.csv`
- **Shape:** `301` rows × `8` columns
- **Exact Duplicates:** `0` rows
- **Overall Missingness:** `4.73%` (114 missing values)

### Column Schema & Missingness Analysis
| Column | Type | Non-Null Count | Missing (%) | Unique Values | Sample Values |
|---|---|---|---|---|---|
| `actorId` | int64 | 301 | 0.00% | 301 | 373, 374, 375 |
| `actorName` | str | 301 | 0.00% | 301 | Aamir Khan, Shah Rukh Khan, Salman Khan |
| `movieCount` | int64 | 301 | 0.00% | 36 | 11, 23, 36 |
| `ratingSum` | int64 | 301 | 0.00% | 96 | 1170, 2000, 2340 |
| `normalizedMovieRank` | float64 | 299 | 0.66% | 156 | 9.448619842529297, 7.550089836120605, 5.402170181274414 |
| `googleHits` | int64 | 301 | 0.00% | 178 | 2460000, 2670000, 3490000 |
| `normalizedGoogleRank` | float64 | 189 | 37.21% | 177 | 7.342830181121826, 7.884580135345459, 10.0 |
| `normalizedRating` | float64 | 301 | 0.00% | 224 | 10.0, 9.22673988342285, 9.20820999145508 |

### Numerical Distributions Summary
| Column | Mean | Std | Min | 25% | 50% (Median) | 75% | Max |
|---|---|---|---|---|---|---|---|
| `actorId` | 523.00 | 87.04 | 373.00 | 448.00 | 523.00 | 598.00 | 673.00 |
| `movieCount` | 10.23 | 8.51 | 0.00 | 5.00 | 7.00 | 12.00 | 54.00 |
| `ratingSum` | 419.14 | 446.97 | 0.00 | 140.00 | 260.00 | 500.00 | 2950.00 |
| `normalizedMovieRank` | 2.77 | 1.63 | 1.00 | 1.49 | 2.37 | 3.62 | 10.00 |
| `googleHits` | 374188.57 | 664716.86 | 0.00 | 0.00 | 76400.00 | 385000.00 | 3490000.00 |
| `normalizedGoogleRank` | 2.53 | 1.95 | 1.00 | 1.24 | 1.64 | 2.97 | 10.00 |
| `normalizedRating` | 2.93 | 1.75 | 1.00 | 1.71 | 2.49 | 3.56 | 10.00 |
## Dataset: `bollywood_movies/BollywoodDirectorRanking.csv`
- **Shape:** `118` rows × `8` columns
- **Exact Duplicates:** `0` rows
- **Overall Missingness:** `0.11%` (1 missing values)

### Column Schema & Missingness Analysis
| Column | Type | Non-Null Count | Missing (%) | Unique Values | Sample Values |
|---|---|---|---|---|---|
| `directorId` | int64 | 118 | 0.00% | 118 | 1, 2, 3 |
| `directorName` | str | 117 | 0.85% | 117 | Rajkumar Hirani, Farah Khan, Karan Johar |
| `movieCount` | int64 | 118 | 0.00% | 12 | 3, 4, 5 |
| `ratingSum` | int64 | 118 | 0.00% | 45 | 440, 430, 350 |
| `normalizedMovieRank` | float64 | 118 | 0.00% | 62 | 10.0, 7.394740104675293, 5.689469814300537 |
| `googleHits` | int64 | 118 | 0.00% | 112 | 146000, 1060000, 1050000 |
| `normalizedGoogleRank` | float64 | 118 | 0.00% | 112 | 2.0779600143432617, 8.883170127868652, 8.808719635009766 |
| `normalizedRating` | float64 | 118 | 0.00% | 118 | 10.0, 8.78472995758057, 7.10459995269775 |

### Numerical Distributions Summary
| Column | Mean | Std | Min | 25% | 50% (Median) | 75% | Max |
|---|---|---|---|---|---|---|---|
| `directorId` | 59.50 | 34.21 | 1.00 | 30.25 | 59.50 | 88.75 | 118.00 |
| `movieCount` | 4.96 | 2.80 | 3.00 | 3.00 | 4.00 | 6.00 | 19.00 |
| `ratingSum` | 220.00 | 182.05 | 60.00 | 92.50 | 145.00 | 270.00 | 1050.00 |
| `normalizedMovieRank` | 2.60 | 1.59 | 1.00 | 1.40 | 2.35 | 3.40 | 10.00 |
| `googleHits` | 217683.56 | 332225.12 | 0.00 | 11175.00 | 48550.00 | 268750.00 | 1210000.00 |
| `normalizedGoogleRank` | 2.59 | 2.49 | 0.00 | 1.07 | 1.35 | 2.99 | 10.00 |
| `normalizedRating` | 2.87 | 1.78 | 1.00 | 1.45 | 2.48 | 3.80 | 10.00 |
## Dataset: `bollywood_movies/BollywoodMovieDetail.csv`
- **Shape:** `1,284` rows × `10` columns
- **Exact Duplicates:** `0` rows
- **Overall Missingness:** `1.43%` (184 missing values)

### Column Schema & Missingness Analysis
| Column | Type | Non-Null Count | Missing (%) | Unique Values | Sample Values |
|---|---|---|---|---|---|
| `imdbId` | str | 1,284 | 0.00% | 1,284 | tt0118578, tt0169102, tt0187279 |
| `title` | str | 1,284 | 0.00% | 1,284 | Albela, Lagaan: Once Upon a Time in India, Meri Biwi Ka Jawa |
| `releaseYear` | int64 | 1,284 | 0.00% | 14 | 2001, 2004, 2002 |
| `releaseDate` | str | 1,231 | 4.13% | 710 | 20 Apr 2001, 08 May 2002, 02 Jul 2004 |
| `genre` | str | 1,282 | 0.16% | 215 | Romance, Adventure \| Drama \| Musical, Action \| Comedy |
| `writers` | str | 1,165 | 9.27% | 1,109 | Honey Irani (screenplay) \| Honey Irani (story) \| Javed Sid |
| `actors` | str | 1,281 | 0.23% | 1,281 | Govinda \| Aishwarya Rai Bachchan \| Jackie Shroff \| Namrat |
| `directors` | str | 1,280 | 0.31% | 731 | Deepak Sareen, Ashutosh Gowariker, Pankaj Parashar \| S.M. I |
| `sequel` | float64 | 1,281 | 0.23% | 3 | 0.0, 1.0, 2.0 |
| `hitFlop` | int64 | 1,284 | 0.00% | 9 | 2, 6, 1 |

### Numerical Distributions Summary
| Column | Mean | Std | Min | 25% | 50% (Median) | 75% | Max |
|---|---|---|---|---|---|---|---|
| `releaseYear` | 2007.99 | 4.01 | 2001.00 | 2004.00 | 2008.00 | 2011.00 | 2014.00 |
| `sequel` | 0.04 | 0.19 | 0.00 | 0.00 | 0.00 | 0.00 | 2.00 |
| `hitFlop` | 2.14 | 1.81 | 1.00 | 1.00 | 1.00 | 2.00 | 9.00 |
## Dataset: `imdb_ott/amazon_prime_titles.csv`
- **Shape:** `9,668` rows × `12` columns
- **Exact Duplicates:** `0` rows
- **Overall Missingness:** `19.10%` (22,162 missing values)

### Column Schema & Missingness Analysis
| Column | Type | Non-Null Count | Missing (%) | Unique Values | Sample Values |
|---|---|---|---|---|---|
| `show_id` | str | 9,668 | 0.00% | 9,668 | s1, s2, s3 |
| `type` | str | 9,668 | 0.00% | 2 | Movie, TV Show |
| `title` | str | 9,668 | 0.00% | 9,668 | The Grand Seduction, Take Care Good Night, Secrets of Decept |
| `director` | str | 7,585 | 21.55% | 5,773 | Don McKellar, Girish Joshi, Josh Webber |
| `cast` | str | 8,435 | 12.75% | 7,927 | Brendan Gleeson, Taylor Kitsch, Gordon Pinsent, Mahesh Manjr |
| `country` | str | 672 | 93.05% | 86 | Canada, India, United States |
| `date_added` | str | 155 | 98.40% | 84 | March 30, 2021, April 1, 2021, April 4, 2021 |
| `release_year` | int64 | 9,668 | 0.00% | 100 | 2014, 2018, 2017 |
| `rating` | str | 9,331 | 3.49% | 24 | 13+, ALL, 18+ |
| `duration` | str | 9,668 | 0.00% | 219 | 113 min, 110 min, 74 min |
| `listed_in` | str | 9,668 | 0.00% | 518 | Comedy, Drama, Drama, International, Action, Drama, Suspense |
| `description` | str | 9,668 | 0.00% | 9,414 | A small fishing village must procure a local doctor to secur |

### Numerical Distributions Summary
| Column | Mean | Std | Min | 25% | 50% (Median) | 75% | Max |
|---|---|---|---|---|---|---|---|
| `release_year` | 2008.34 | 18.92 | 1920.00 | 2007.00 | 2016.00 | 2019.00 | 2021.00 |
## Dataset: `imdb_ott/apple.csv`
- **Shape:** `170` rows × `15` columns
- **Exact Duplicates:** `0` rows
- **Overall Missingness:** `3.29%` (84 missing values)

### Column Schema & Missingness Analysis
| Column | Type | Non-Null Count | Missing (%) | Unique Values | Sample Values |
|---|---|---|---|---|---|
| `id` | str | 170 | 0.00% | 170 | tm1300, tm71152, tm2562 |
| `title` | str | 170 | 0.00% | 170 | A Charlie Brown Christmas, It's the Great Pumpkin, Charlie B |
| `type` | str | 170 | 0.00% | 2 | MOVIE, SHOW |
| `description` | str | 170 | 0.00% | 170 | When Charlie Brown complains about the overwhelming material |
| `release_year` | int64 | 170 | 0.00% | 21 | 1965, 1966, 1973 |
| `age_certification` | str | 159 | 6.47% | 10 | G, TV-G, R |
| `runtime` | int64 | 170 | 0.00% | 78 | 25, 26, 28 |
| `genres` | str | 170 | 0.00% | 97 | ['comedy', 'drama', 'family', 'music', 'animation'], ['anima |
| `production_countries` | str | 170 | 0.00% | 26 | ['US'], ['US', 'GB'], ['IT', 'GB', 'US'] |
| `seasons` | float64 | 108 | 36.47% | 5 | 5.0, 1.0, 2.0 |
| `imdb_id` | str | 169 | 0.59% | 169 | tt0059026, tt0060550, tt0068359 |
| `imdb_score` | float64 | 167 | 1.76% | 42 | 8.3, 8.2, 7.7 |
| `imdb_votes` | float64 | 166 | 2.35% | 166 | 40328.0, 20299.0, 11406.0 |
| `tmdb_popularity` | float64 | 170 | 0.00% | 167 | 10.848, 12.458, 12.591 |
| `tmdb_score` | float64 | 167 | 1.76% | 90 | 7.688, 7.474, 7.311 |

### Numerical Distributions Summary
| Column | Mean | Std | Min | 25% | 50% (Median) | 75% | Max |
|---|---|---|---|---|---|---|---|
| `release_year` | 2017.90 | 10.36 | 1965.00 | 2020.00 | 2021.00 | 2022.00 | 2023.00 |
| `runtime` | 51.11 | 35.87 | 0.00 | 25.00 | 45.00 | 61.00 | 140.00 |
| `seasons` | 1.64 | 0.87 | 1.00 | 1.00 | 1.00 | 2.00 | 5.00 |
| `imdb_score` | 7.13 | 1.01 | 2.70 | 6.60 | 7.30 | 7.80 | 9.50 |
| `imdb_votes` | 18139.13 | 42929.99 | 19.00 | 537.75 | 2796.00 | 14404.00 | 374255.00 |
| `tmdb_popularity` | 25.48 | 38.08 | 2.90 | 5.97 | 10.81 | 26.12 | 270.03 |
| `tmdb_score` | 7.19 | 1.20 | 2.00 | 6.60 | 7.30 | 7.91 | 10.00 |
## Dataset: `imdb_ott/Final Bollywood.csv`
- **Shape:** `1,321` rows × `8` columns
- **Exact Duplicates:** `0` rows
- **Overall Missingness:** `0.01%` (1 missing values)

### Column Schema & Missingness Analysis
| Column | Type | Non-Null Count | Missing (%) | Unique Values | Sample Values |
|---|---|---|---|---|---|
| `Title` | str | 1,321 | 0.00% | 1,312 | Rama Rama Kya Hai Drama, Humne Jeena Seekh Liya, Halla Bol |
| `Date` | str | 1,321 | 0.00% | 602 | 04-01-2008, 11-01-2008, 18-01-2008 |
| `Genre` | str | 1,320 | 0.08% | 260 | comedy, social, romance,drama,comedy |
| `orig_lang` | str | 1,321 | 0.00% | 1 | Hindi |
| `Revenue($)` | int64 | 1,321 | 0.00% | 167 | 60000, 180000, 900000 |
| `Budget($)` | float64 | 1,321 | 0.00% | 900 | 1020.0, 9900.0, 680400.0 |
| `country` | str | 1,321 | 0.00% | 1 | IND |
| `score` | int64 | 1,321 | 0.00% | 79 | 44, 87, 30 |

### Numerical Distributions Summary
| Column | Mean | Std | Min | 25% | 50% (Median) | 75% | Max |
|---|---|---|---|---|---|---|---|
| `Revenue($)` | 1818908.63 | 2962205.60 | 3900.00 | 180000.00 | 630000.00 | 2280000.00 | 25200000.00 |
| `Budget($)` | 2879260.98 | 7637735.35 | 174.00 | 13800.00 | 141450.00 | 2135400.00 | 96193440.00 |
| `score` | 58.38 | 22.94 | 20.00 | 38.00 | 58.00 | 78.00 | 98.00 |
## Dataset: `imdb_ott/Final Hollywood.csv`
- **Shape:** `10,177` rows × `8` columns
- **Exact Duplicates:** `0` rows
- **Overall Missingness:** `0.10%` (85 missing values)

### Column Schema & Missingness Analysis
| Column | Type | Non-Null Count | Missing (%) | Unique Values | Sample Values |
|---|---|---|---|---|---|
| `Creed III` | str | 10,177 | 0.00% | 9,659 | Avatar: The Way of Water, The Super Mario Bros. Movie, Mummi |
| `02-03-2023` | str | 10,177 | 0.00% | 5,688 | 15-12-2022, 05-04-2023, 05-01-2023 |
| `Drama, Action` | str | 10,092 | 0.84% | 2,303 | Science Fiction, Adventure, Action, Animation, Adventure, Fa |
| ` English` | str | 10,177 | 0.00% | 54 |  English,  Spanish, Castilian,  Norwegian |
| `271616668` | float64 | 10,177 | 0.00% | 8,226 | 2316794914.0, 724459031.0, 34200000.0 |
| `75000000` | float64 | 10,177 | 0.00% | 2,316 | 460000000.0, 100000000.0, 12300000.0 |
| `AU` | str | 10,177 | 0.00% | 60 | AU, US, MX |
| `73` | int64 | 10,177 | 0.00% | 79 | 78, 76, 70 |

### Numerical Distributions Summary
| Column | Mean | Std | Min | 25% | 50% (Median) | 75% | Max |
|---|---|---|---|---|---|---|---|
| `271616668` | 253138277.90 | 277801637.24 | 0.00 | 28588425.00 | 152925093.00 | 417803439.00 | 2923706026.00 |
| `75000000` | 64881384.73 | 57078361.50 | 1.00 | 15000000.00 | 50000000.00 | 105000000.00 | 460000000.00 |
| `73` | 63.50 | 13.54 | 0.00 | 59.00 | 65.00 | 71.00 | 100.00 |
## Dataset: `imdb_ott/hotstar.csv`
- **Shape:** `6,874` rows × `7` columns
- **Exact Duplicates:** `12` rows
- **Overall Missingness:** `4.79%` (2,306 missing values)

### Column Schema & Missingness Analysis
| Column | Type | Non-Null Count | Missing (%) | Unique Values | Sample Values |
|---|---|---|---|---|---|
| `title` | str | 6,874 | 0.00% | 6,677 | Sambha - Aajcha Chawa, Cars Toon: Mater And The Ghostlight,  |
| `description` | str | 6,874 | 0.00% | 6,815 | A young man sets off on a mission to clean up the society fr |
| `genre` | str | 6,874 | 0.00% | 37 | Action, Animation, Romance |
| `year` | int64 | 6,874 | 0.00% | 78 | 2012, 2006, 2022 |
| `age_rating` | str | 6,874 | 0.00% | 6 | U/A 16+, U, U/A 7+ |
| `running_time` | float64 | 4,568 | 33.55% | 187 | 141.0, 7.0, 157.0 |
| `type` | str | 6,874 | 0.00% | 2 | movie, tv |

### Numerical Distributions Summary
| Column | Mean | Std | Min | 25% | 50% (Median) | 75% | Max |
|---|---|---|---|---|---|---|---|
| `year` | 2011.72 | 11.94 | 1928.00 | 2009.00 | 2016.00 | 2019.00 | 2023.00 |
| `running_time` | 98.75 | 49.41 | 1.00 | 70.00 | 116.00 | 135.00 | 229.00 |
## Dataset: `imdb_ott/Netflix.csv`
- **Shape:** `5,331` rows × `57` columns
- **Exact Duplicates:** `0` rows
- **Overall Missingness:** `0.00%` (0 missing values)

### Column Schema & Missingness Analysis
| Column | Type | Non-Null Count | Missing (%) | Unique Values | Sample Values |
|---|---|---|---|---|---|
| `type` | str | 5,331 | 0.00% | 2 | Movie, TV Show |
| `title` | str | 5,331 | 0.00% | 5,329 | Sankofa, The Great British Baking Show, The Starling |
| `director` | str | 5,331 | 0.00% | 3,945 | Haile Gerima, Andy Devonshire, Theodore Melfi |
| `cast` | str | 5,331 | 0.00% | 5,199 | Kofi Ghanaba, Oyafunmike Ogunlano, Alexandra Duah, Nick Medl |
| `country` | str | 5,331 | 0.00% | 604 | United States, Ghana, Burkina Faso, United Kingdom, Germany, |
| `date_added` | str | 5,331 | 0.00% | 1,450 | 24-09-2021, 23-09-2021, 21-09-2021 |
| `release_year` | int64 | 5,331 | 0.00% | 72 | 1993, 2021, 1998 |
| `rating` | str | 5,331 | 0.00% | 14 | TV-MA, TV-14, PG-13 |
| `duration` | str | 5,331 | 0.00% | 198 | 125 min, 9 Seasons, 104 min |
| `listed_in` | str | 5,331 | 0.00% | 335 | Dramas, Independent Movies, International Movies, British TV |
| `description` | str | 5,331 | 0.00% | 5,320 | On a photo shoot in Ghana, an American model slips back in t |
| `day_added` | int64 | 5,331 | 0.00% | 31 | 24, 23, 21 |
| `year_added` | int64 | 5,331 | 0.00% | 14 | 2021, 2020, 2019 |
| `month_added` | int64 | 5,331 | 0.00% | 12 | 9, 8, 7 |
| `Teen_TV_Shows` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Science_&_Nature_TV` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Cult_Movies` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `TV_Thrillers` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Horror_Movies` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `International_TV_Shows` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `British_TV_Shows` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Kids'_TV` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Action_&_Adventure` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Crime_TV_Shows` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Independent_Movies` | int64 | 5,331 | 0.00% | 2 | 1, 0 |
| `Romantic_Movies` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `LGBTQ_Movies` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Stand-Up_Comedy_&_Talk_Shows` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `TV_Dramas` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Classic_Movies` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Anime_Features` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Korean_TV_Shows` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Children_&_Family_Movies` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Dramas` | int64 | 5,331 | 0.00% | 2 | 1, 0 |
| `TV_Shows` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Documentaries` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Stand-Up_Comedy` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `TV_Comedies` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Reality_TV` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Romantic_TV_Shows` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Docuseries` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `TV_Action_&_Adventure` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Classic_&_Cult_TV` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `TV_Mysteries` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Sci-Fi_&_Fantasy` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Anime_Series` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `International_Movies` | int64 | 5,331 | 0.00% | 2 | 1, 0 |
| `Music_&_Musicals` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Spanish-Language_TV_Shows` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Sports_Movies` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `TV_Horror` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Comedies` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `TV_Sci-Fi_&_Fantasy` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Movies` | int64 | 5,331 | 0.00% | 2 | 1, 0 |
| `Faith_&_Spirituality` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `Thrillers` | int64 | 5,331 | 0.00% | 2 | 0, 1 |
| `User_Rating` | int64 | 5,331 | 0.00% | 70 | 98, 43, 92 |

### Numerical Distributions Summary
| Column | Mean | Std | Min | 25% | 50% (Median) | 75% | Max |
|---|---|---|---|---|---|---|---|
| `release_year` | 2012.74 | 9.63 | 1942.00 | 2011.00 | 2016.00 | 2018.00 | 2021.00 |
| `day_added` | 11.87 | 9.93 | 1.00 | 1.00 | 11.00 | 20.00 | 31.00 |
| `year_added` | 2018.83 | 1.54 | 2008.00 | 2018.00 | 2019.00 | 2020.00 | 2021.00 |
| `month_added` | 6.62 | 3.50 | 1.00 | 4.00 | 7.00 | 10.00 | 12.00 |
| `Teen_TV_Shows` | 0.00 | 0.02 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Science_&_Nature_TV` | 0.00 | 0.01 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Cult_Movies` | 0.01 | 0.11 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `TV_Thrillers` | 0.00 | 0.02 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Horror_Movies` | 0.06 | 0.24 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `International_TV_Shows` | 0.02 | 0.13 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `British_TV_Shows` | 0.00 | 0.06 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Kids'_TV` | 0.00 | 0.05 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Action_&_Adventure` | 0.15 | 0.36 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Crime_TV_Shows` | 0.01 | 0.08 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Independent_Movies` | 0.14 | 0.35 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Romantic_Movies` | 0.11 | 0.31 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `LGBTQ_Movies` | 0.02 | 0.12 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Stand-Up_Comedy_&_Talk_Shows` | 0.00 | 0.05 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `TV_Dramas` | 0.01 | 0.10 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Classic_Movies` | 0.02 | 0.14 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Anime_Features` | 0.01 | 0.11 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Korean_TV_Shows` | 0.00 | 0.04 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Children_&_Family_Movies` | 0.09 | 0.29 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Dramas` | 0.44 | 0.50 | 0.00 | 0.00 | 0.00 | 1.00 | 1.00 |
| `TV_Shows` | 0.02 | 0.15 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Documentaries` | 0.07 | 0.26 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Stand-Up_Comedy` | 0.06 | 0.23 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `TV_Comedies` | 0.01 | 0.07 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Reality_TV` | 0.00 | 0.02 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Romantic_TV_Shows` | 0.00 | 0.06 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Docuseries` | 0.00 | 0.05 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `TV_Action_&_Adventure` | 0.00 | 0.05 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Classic_&_Cult_TV` | 0.00 | 0.02 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `TV_Mysteries` | 0.00 | 0.04 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Sci-Fi_&_Fantasy` | 0.05 | 0.21 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Anime_Series` | 0.00 | 0.04 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `International_Movies` | 0.44 | 0.50 | 0.00 | 0.00 | 0.00 | 1.00 | 1.00 |
| `Music_&_Musicals` | 0.05 | 0.23 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Spanish-Language_TV_Shows` | 0.00 | 0.04 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Sports_Movies` | 0.03 | 0.17 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `TV_Horror` | 0.00 | 0.04 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Comedies` | 0.30 | 0.46 | 0.00 | 0.00 | 0.00 | 1.00 | 1.00 |
| `TV_Sci-Fi_&_Fantasy` | 0.00 | 0.03 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Movies` | 0.73 | 0.45 | 0.00 | 0.00 | 1.00 | 1.00 | 1.00 |
| `Faith_&_Spirituality` | 0.01 | 0.10 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `Thrillers` | 0.10 | 0.30 | 0.00 | 0.00 | 0.00 | 0.00 | 1.00 |
| `User_Rating` | 64.65 | 20.19 | 30.00 | 48.00 | 65.00 | 83.00 | 99.00 |

---

## Cross-Dataset Relationship & Joining Strategy

1. **Bollywood Movie Details (`bollywood_movies/BollywoodMovieDetail.csv` & `bollywood_actress/BollywoodMovieDetail.csv`)**:
   - Contains core Bollywood movie metadata: `imdbId`, `title`, `releaseYear`, `releaseDate`, `genre`, `writers`, `actors`, `directors`, `sequel`, `hitFlop`.
   - `hitFlop` provides an explicit, historical ground-truth commercial classification (`1` to `9` or verdict rating scale).
2. **Actor & Director Rankings (`BollywoodActorRanking.csv`, `BollywoodDirectorRanking.csv`)**:
   - Contains actor/director names, movie counts, normalized rating scores, box office metrics.
   - Can be joined via normalized person name keys.
3. **IMDb & OTT Platform Tables (`imdb_ott/Final Bollywood.csv`, `imdb_ott/Netflix.csv`, `imdb_ott/amazon_prime_titles.csv`, etc.)**:
   - Contains OTT presence flags, ratings, runtime, description, and platform distribution.
   - Merging key: Normalized `(title, release_year)`.

---

## Leakage Risk Audit & Categorization

| Feature Category | Features | Pre / Post Release | Modeling Status | Rationale |
|---|---|---|---|---|
| **Metadata** | `genre`, `release_year`, `release_month`, `runtime`, `language`, `is_sequel` | PRE-RELEASE | **INCLUDED** | Known before production / release. |
| **Cast / Crew Track Record** | `lead_actor_prior_success_rate`, `director_prior_avg_score`, `known_actor_count` | PRE-RELEASE (Prior strictly $t < t_0$) | **INCLUDED** | Historical career performance strictly before release date. |
| **Target Variables** | `hitFlop` (Class), `box_office_collection` / `normalized_commercial_index` | POST-RELEASE TARGET | **TARGET ONLY** | The outcome being predicted. |
| **Data Leakage Risk** | Post-release IMDb user votes, post-release audience reviews, final gross | POST-RELEASE | **STRICTLY EXCLUDED** | Only known after the film has concluded theatrical/OTT run. |
