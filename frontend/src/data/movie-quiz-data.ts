/**
 * Movie Quiz Question Database
 * Comprehensive movie trivia for survival game
 * Categories: Classic Films, Modern Blockbusters, Directors, Actors, Awards, Franchises, Animation, Horror, Sci-Fi, Quotes
 */

import type { QuizQuestion } from '@/types/quiz'

export const movieQuizQuestions: QuizQuestion[] = [
  // ============================================================================
  // CLASSIC FILMS (1-50)
  // ============================================================================
  {
    id: 'movie_1',
    question: 'What year was "The Godfather" released?',
    options: ['1970', '1972', '1974', '1976'],
    correctAnswer: 1,
    explanation: 'Category: classic',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'classic']
  },
  {
    id: 'movie_2',
    question: 'Who directed "Citizen Kane"?',
    options: ['Alfred Hitchcock', 'Orson Welles', 'John Ford', 'Billy Wilder'],
    correctAnswer: 1,
    explanation: 'Category: classic',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'classic', 'directors']
  },
  {
    id: 'movie_3',
    question: 'What is the name of the sled in "Citizen Kane"?',
    options: ['Rosebud', 'Snowflake', 'Winter', 'Childhood'],
    correctAnswer: 0,
    explanation: 'Category: classic',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'classic']
  },
  {
    id: 'movie_4',
    question: 'In "Casablanca," what is the name of Rick\'s café?',
    options: ['Rick\'s Place', 'Rick\'s Café Américain', 'The Blue Parrot', 'Casablanca Club'],
    correctAnswer: 1,
    explanation: 'Category: classic',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'classic']
  },
  {
    id: 'movie_5',
    question: 'Who played Scarlett O\'Hara in "Gone with the Wind"?',
    options: ['Bette Davis', 'Vivien Leigh', 'Katharine Hepburn', 'Joan Crawford'],
    correctAnswer: 1,
    explanation: 'Category: classic',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'classic', 'actors']
  },
  {
    id: 'movie_6',
    question: 'What year was "Gone with the Wind" released?',
    options: ['1937', '1939', '1941', '1943'],
    correctAnswer: 1,
    explanation: 'Category: classic',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'classic']
  },
  {
    id: 'movie_7',
    question: 'Who directed "Psycho" (1960)?',
    options: ['Stanley Kubrick', 'Alfred Hitchcock', 'Roman Polanski', 'William Friedkin'],
    correctAnswer: 1,
    explanation: 'Category: classic',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'classic', 'directors']
  },
  {
    id: 'movie_8',
    question: 'What is the famous shower scene music in "Psycho" called?',
    options: ['The Murder', 'Psycho Theme', 'The Knife', 'Strings of Fear'],
    correctAnswer: 0,
    explanation: 'Category: classic',
    difficulty: 'expert',
    category: 'movies',
    points: 3,
    tags: ['movies', 'classic']
  },
  {
    id: 'movie_9',
    question: 'Who played the title role in "Lawrence of Arabia"?',
    options: ['Richard Burton', 'Peter O\'Toole', 'Omar Sharif', 'Alec Guinness'],
    correctAnswer: 1,
    explanation: 'Category: classic',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'classic', 'actors']
  },
  {
    id: 'movie_10',
    question: 'What was the first feature-length animated film?',
    options: ['Fantasia', 'Snow White and the Seven Dwarfs', 'Pinocchio', 'Bambi'],
    correctAnswer: 1,
    explanation: 'Category: classic',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'classic', 'animation']
  },
  {
    id: 'movie_11',
    question: 'Who starred in "Singin\' in the Rain"?',
    options: ['Fred Astaire', 'Gene Kelly', 'Bing Crosby', 'Frank Sinatra'],
    correctAnswer: 1,
    explanation: 'Category: classic',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'classic', 'actors']
  },
  {
    id: 'movie_12',
    question: 'What year was "12 Angry Men" released?',
    options: ['1955', '1957', '1959', '1961'],
    correctAnswer: 1,
    explanation: 'Category: classic',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'classic']
  },
  {
    id: 'movie_13',
    question: 'Who directed "The Wizard of Oz"?',
    options: ['Victor Fleming', 'George Cukor', 'King Vidor', 'All three'],
    correctAnswer: 0,
    explanation: 'Category: classic',
    difficulty: 'expert',
    category: 'movies',
    points: 3,
    tags: ['movies', 'classic', 'directors']
  },
  {
    id: 'movie_14',
    question: 'What color were Dorothy\'s slippers in the original book?',
    options: ['Ruby Red', 'Silver', 'Gold', 'Blue'],
    correctAnswer: 1,
    explanation: 'Category: classic',
    difficulty: 'expert',
    category: 'movies',
    points: 3,
    tags: ['movies', 'classic']
  },
  {
    id: 'movie_15',
    question: 'Who played Don Vito Corleone in "The Godfather"?',
    options: ['Al Pacino', 'Robert De Niro', 'Marlon Brando', 'James Caan'],
    correctAnswer: 2,
    explanation: 'Category: classic',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'classic', 'actors']
  },
  {
    id: 'movie_16',
    question: 'What is the famous line from "Casablanca"?',
    options: ['Play it again, Sam', 'Here\'s looking at you, kid', 'Of all the gin joints...', 'We\'ll always have Paris'],
    correctAnswer: 1,
    explanation: 'Category: classic',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'classic', 'quotes']
  },
  {
    id: 'movie_17',
    question: 'Who directed "Vertigo" (1958)?',
    options: ['Billy Wilder', 'Alfred Hitchcock', 'John Huston', 'Howard Hawks'],
    correctAnswer: 1,
    explanation: 'Category: classic',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'classic', 'directors']
  },
  {
    id: 'movie_18',
    question: 'What was Humphrey Bogart\'s character name in "Casablanca"?',
    options: ['Sam', 'Rick Blaine', 'Victor Laszlo', 'Louis Renault'],
    correctAnswer: 1,
    explanation: 'Category: classic',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'classic']
  },
  {
    id: 'movie_19',
    question: 'Who directed "Sunset Boulevard"?',
    options: ['Billy Wilder', 'Alfred Hitchcock', 'John Ford', 'Frank Capra'],
    correctAnswer: 0,
    explanation: 'Category: classic',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'classic', 'directors']
  },
  {
    id: 'movie_20',
    question: 'What year was "Some Like It Hot" released?',
    options: ['1957', '1959', '1961', '1963'],
    correctAnswer: 1,
    explanation: 'Category: classic',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'classic']
  },

  {
    id: 'movie_21',
    question: 'Who starred in "Some Like It Hot" alongside Tony Curtis and Jack Lemmon?',
    options: ['Audrey Hepburn', 'Marilyn Monroe', 'Grace Kelly', 'Elizabeth Taylor'],
    correctAnswer: 1,
    explanation: 'Category: classic',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'classic', 'actors']
  },
  {
    id: 'movie_22',
    question: 'What was the first "talkie" movie?',
    options: ['The Jazz Singer', 'Singin\' in the Rain', 'The Broadway Melody', 'Lights of New York'],
    correctAnswer: 0,
    explanation: 'Category: classic',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'classic']
  },
  {
    id: 'movie_23',
    question: 'Who directed "It\'s a Wonderful Life"?',
    options: ['John Ford', 'Frank Capra', 'Howard Hawks', 'William Wyler'],
    correctAnswer: 1,
    explanation: 'Category: classic',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'classic', 'directors']
  },
  {
    id: 'movie_24',
    question: 'What is the angel\'s name in "It\'s a Wonderful Life"?',
    options: ['Gabriel', 'Michael', 'Clarence', 'Joseph'],
    correctAnswer: 2,
    explanation: 'Category: classic',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'classic']
  },
  {
    id: 'movie_25',
    question: 'Who played Norman Bates in "Psycho"?',
    options: ['James Stewart', 'Anthony Perkins', 'Cary Grant', 'Rock Hudson'],
    correctAnswer: 1,
    explanation: 'Category: classic',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'classic', 'actors']
  },

  // ============================================================================
  // MODERN BLOCKBUSTERS (26-100)
  // ============================================================================
  {
    id: 'movie_26',
    question: 'What year was the first "Star Wars" film released?',
    options: ['1975', '1977', '1979', '1981'],
    correctAnswer: 1,
    explanation: 'Category: blockbuster',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'blockbuster', 'scifi']
  },
  {
    id: 'movie_27',
    question: 'Who directed "Jaws"?',
    options: ['George Lucas', 'Steven Spielberg', 'Francis Ford Coppola', 'Martin Scorsese'],
    correctAnswer: 1,
    explanation: 'Category: blockbuster',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'blockbuster', 'directors']
  },
  {
    id: 'movie_28',
    question: 'What was the highest-grossing film of all time until "Avatar"?',
    options: ['Star Wars', 'E.T.', 'Titanic', 'Jurassic Park'],
    correctAnswer: 2,
    explanation: 'Category: blockbuster',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'blockbuster']
  },
  {
    id: 'movie_29',
    question: 'Who played Jack in "Titanic"?',
    options: ['Brad Pitt', 'Leonardo DiCaprio', 'Matt Damon', 'Johnny Depp'],
    correctAnswer: 1,
    explanation: 'Category: blockbuster',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'blockbuster', 'actors']
  },
  {
    id: 'movie_30',
    question: 'What year was "Titanic" released?',
    options: ['1995', '1997', '1999', '2001'],
    correctAnswer: 1,
    explanation: 'Category: blockbuster',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'blockbuster']
  },
  {
    id: 'movie_31',
    question: 'Who directed "Avatar" (2009)?',
    options: ['Steven Spielberg', 'James Cameron', 'Peter Jackson', 'Christopher Nolan'],
    correctAnswer: 1,
    explanation: 'Category: blockbuster',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'blockbuster', 'directors']
  },
  {
    id: 'movie_32',
    question: 'What is the name of the planet in "Avatar"?',
    options: ['Pandora', 'Endor', 'Tatooine', 'Naboo'],
    correctAnswer: 0,
    explanation: 'Category: blockbuster',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'blockbuster', 'scifi']
  },
  {
    id: 'movie_33',
    question: 'What year was "Jurassic Park" released?',
    options: ['1991', '1993', '1995', '1997'],
    correctAnswer: 1,
    explanation: 'Category: blockbuster',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'blockbuster']
  },
  {
    id: 'movie_34',
    question: 'Who wrote the novel "Jurassic Park"?',
    options: ['Stephen King', 'Michael Crichton', 'Dean Koontz', 'Tom Clancy'],
    correctAnswer: 1,
    explanation: 'Category: blockbuster',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'blockbuster']
  },
  {
    id: 'movie_35',
    question: 'Who played Indiana Jones?',
    options: ['Tom Selleck', 'Harrison Ford', 'Kurt Russell', 'Mel Gibson'],
    correctAnswer: 1,
    explanation: 'Category: blockbuster',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'blockbuster', 'actors']
  },
  {
    id: 'movie_36',
    question: 'What is Indiana Jones\' real first name?',
    options: ['Indiana', 'Henry', 'John', 'James'],
    correctAnswer: 1,
    explanation: 'Category: blockbuster',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'blockbuster']
  },
  {
    id: 'movie_37',
    question: 'Who directed "E.T. the Extra-Terrestrial"?',
    options: ['George Lucas', 'Steven Spielberg', 'Robert Zemeckis', 'Ron Howard'],
    correctAnswer: 1,
    explanation: 'Category: blockbuster',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'blockbuster', 'directors']
  },
  {
    id: 'movie_38',
    question: 'What candy was featured in "E.T."?',
    options: ['M&Ms', 'Reese\'s Pieces', 'Skittles', 'Hershey\'s Kisses'],
    correctAnswer: 1,
    explanation: 'Category: blockbuster',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'blockbuster']
  },
  {
    id: 'movie_39',
    question: 'What year was "The Matrix" released?',
    options: ['1997', '1999', '2001', '2003'],
    correctAnswer: 1,
    explanation: 'Category: blockbuster',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'blockbuster', 'scifi']
  },
  {
    id: 'movie_40',
    question: 'Who played Neo in "The Matrix"?',
    options: ['Brad Pitt', 'Keanu Reeves', 'Nicolas Cage', 'Johnny Depp'],
    correctAnswer: 1,
    explanation: 'Category: blockbuster',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'blockbuster', 'actors']
  },
  {
    id: 'movie_41',
    question: 'What color pill does Neo take in "The Matrix"?',
    options: ['Blue', 'Red', 'Green', 'Yellow'],
    correctAnswer: 1,
    explanation: 'Category: blockbuster',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'blockbuster']
  },
  {
    id: 'movie_42',
    question: 'Who directed "The Dark Knight"?',
    options: ['Tim Burton', 'Christopher Nolan', 'Zack Snyder', 'Matt Reeves'],
    correctAnswer: 1,
    explanation: 'Category: blockbuster',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'blockbuster', 'directors']
  },
  {
    id: 'movie_43',
    question: 'Who played the Joker in "The Dark Knight"?',
    options: ['Jack Nicholson', 'Heath Ledger', 'Jared Leto', 'Joaquin Phoenix'],
    correctAnswer: 1,
    explanation: 'Category: blockbuster',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'blockbuster', 'actors']
  },
  {
    id: 'movie_44',
    question: 'What year was "The Dark Knight" released?',
    options: ['2006', '2008', '2010', '2012'],
    correctAnswer: 1,
    explanation: 'Category: blockbuster',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'blockbuster']
  },
  {
    id: 'movie_45',
    question: 'Who directed "Inception"?',
    options: ['Steven Spielberg', 'Christopher Nolan', 'Denis Villeneuve', 'Ridley Scott'],
    correctAnswer: 1,
    explanation: 'Category: blockbuster',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'blockbuster', 'directors']
  },

  {
    id: 'movie_46',
    question: 'What is the spinning top called in "Inception"?',
    options: ['The Spinner', 'The Totem', 'The Dream Catcher', 'The Token'],
    correctAnswer: 1,
    explanation: 'Category: blockbuster',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'blockbuster']
  },
  {
    id: 'movie_47',
    question: 'Who played Tony Stark/Iron Man in the MCU?',
    options: ['Chris Evans', 'Robert Downey Jr.', 'Chris Hemsworth', 'Mark Ruffalo'],
    correctAnswer: 1,
    explanation: 'Category: blockbuster',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'blockbuster', 'mcu']
  },
  {
    id: 'movie_48',
    question: 'What year was the first "Iron Man" movie released?',
    options: ['2006', '2008', '2010', '2012'],
    correctAnswer: 1,
    explanation: 'Category: blockbuster',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'blockbuster', 'mcu']
  },
  {
    id: 'movie_49',
    question: 'Who directed "Avengers: Endgame"?',
    options: ['Joss Whedon', 'The Russo Brothers', 'James Gunn', 'Taika Waititi'],
    correctAnswer: 1,
    explanation: 'Category: blockbuster',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'blockbuster', 'mcu']
  },
  {
    id: 'movie_50',
    question: 'What is the name of Thor\'s hammer?',
    options: ['Stormbreaker', 'Mjolnir', 'Gungnir', 'Hofund'],
    correctAnswer: 1,
    explanation: 'Category: blockbuster',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'blockbuster', 'mcu']
  },

  // ============================================================================
  // DIRECTORS (51-100)
  // ============================================================================
  {
    id: 'movie_51',
    question: 'Who directed "Pulp Fiction"?',
    options: ['Martin Scorsese', 'Quentin Tarantino', 'David Fincher', 'Coen Brothers'],
    correctAnswer: 1,
    explanation: 'Category: directors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'directors']
  },
  {
    id: 'movie_52',
    question: 'Who directed "Schindler\'s List"?',
    options: ['Steven Spielberg', 'Roman Polanski', 'Martin Scorsese', 'Oliver Stone'],
    correctAnswer: 0,
    explanation: 'Category: directors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'directors']
  },
  {
    id: 'movie_53',
    question: 'Who directed "2001: A Space Odyssey"?',
    options: ['Ridley Scott', 'Stanley Kubrick', 'Steven Spielberg', 'George Lucas'],
    correctAnswer: 1,
    explanation: 'Category: directors',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'directors', 'scifi']
  },
  {
    id: 'movie_54',
    question: 'Who directed "The Shining"?',
    options: ['John Carpenter', 'Stanley Kubrick', 'Wes Craven', 'Tobe Hooper'],
    correctAnswer: 1,
    explanation: 'Category: directors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'directors', 'horror']
  },
  {
    id: 'movie_55',
    question: 'Who directed "Goodfellas"?',
    options: ['Francis Ford Coppola', 'Martin Scorsese', 'Brian De Palma', 'Quentin Tarantino'],
    correctAnswer: 1,
    explanation: 'Category: directors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'directors']
  },
  {
    id: 'movie_56',
    question: 'Who directed "Fight Club"?',
    options: ['Christopher Nolan', 'David Fincher', 'Darren Aronofsky', 'Denis Villeneuve'],
    correctAnswer: 1,
    explanation: 'Category: directors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'directors']
  },
  {
    id: 'movie_57',
    question: 'Who directed "The Silence of the Lambs"?',
    options: ['David Fincher', 'Jonathan Demme', 'Ridley Scott', 'Michael Mann'],
    correctAnswer: 1,
    explanation: 'Category: directors',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'directors']
  },
  {
    id: 'movie_58',
    question: 'Who directed "Blade Runner"?',
    options: ['James Cameron', 'Ridley Scott', 'Paul Verhoeven', 'John Carpenter'],
    correctAnswer: 1,
    explanation: 'Category: directors',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'directors', 'scifi']
  },
  {
    id: 'movie_59',
    question: 'Who directed "Alien" (1979)?',
    options: ['James Cameron', 'Ridley Scott', 'John Carpenter', 'David Cronenberg'],
    correctAnswer: 1,
    explanation: 'Category: directors',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'directors', 'scifi']
  },
  {
    id: 'movie_60',
    question: 'Who directed "Aliens" (1986)?',
    options: ['Ridley Scott', 'James Cameron', 'David Fincher', 'Jean-Pierre Jeunet'],
    correctAnswer: 1,
    explanation: 'Category: directors',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'directors', 'scifi']
  },
  {
    id: 'movie_61',
    question: 'Who directed "The Lord of the Rings" trilogy?',
    options: ['Steven Spielberg', 'Peter Jackson', 'Guillermo del Toro', 'Sam Raimi'],
    correctAnswer: 1,
    explanation: 'Category: directors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'directors', 'fantasy']
  },
  {
    id: 'movie_62',
    question: 'Who directed "Forrest Gump"?',
    options: ['Steven Spielberg', 'Robert Zemeckis', 'Ron Howard', 'Barry Levinson'],
    correctAnswer: 1,
    explanation: 'Category: directors',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'directors']
  },
  {
    id: 'movie_63',
    question: 'Who directed "Back to the Future"?',
    options: ['Steven Spielberg', 'Robert Zemeckis', 'Joe Dante', 'Richard Donner'],
    correctAnswer: 1,
    explanation: 'Category: directors',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'directors']
  },
  {
    id: 'movie_64',
    question: 'Who directed "Se7en"?',
    options: ['Christopher Nolan', 'David Fincher', 'Denis Villeneuve', 'Darren Aronofsky'],
    correctAnswer: 1,
    explanation: 'Category: directors',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'directors']
  },
  {
    id: 'movie_65',
    question: 'Who directed "The Social Network"?',
    options: ['Aaron Sorkin', 'David Fincher', 'Danny Boyle', 'Bennett Miller'],
    correctAnswer: 1,
    explanation: 'Category: directors',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'directors']
  },
  {
    id: 'movie_66',
    question: 'Who directed "Kill Bill"?',
    options: ['Robert Rodriguez', 'Quentin Tarantino', 'Guy Ritchie', 'Matthew Vaughn'],
    correctAnswer: 1,
    explanation: 'Category: directors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'directors']
  },
  {
    id: 'movie_67',
    question: 'Who directed "Django Unchained"?',
    options: ['Quentin Tarantino', 'Sergio Leone', 'Clint Eastwood', 'Coen Brothers'],
    correctAnswer: 0,
    explanation: 'Category: directors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'directors']
  },
  {
    id: 'movie_68',
    question: 'Who directed "The Departed"?',
    options: ['Brian De Palma', 'Martin Scorsese', 'Michael Mann', 'Ridley Scott'],
    correctAnswer: 1,
    explanation: 'Category: directors',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'directors']
  },
  {
    id: 'movie_69',
    question: 'Who directed "Taxi Driver"?',
    options: ['Francis Ford Coppola', 'Martin Scorsese', 'William Friedkin', 'Sidney Lumet'],
    correctAnswer: 1,
    explanation: 'Category: directors',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'directors']
  },
  {
    id: 'movie_70',
    question: 'Who directed "Raging Bull"?',
    options: ['Sylvester Stallone', 'Martin Scorsese', 'Michael Mann', 'Ron Howard'],
    correctAnswer: 1,
    explanation: 'Category: directors',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'directors']
  },

  {
    id: 'movie_71',
    question: 'Who directed "Interstellar"?',
    options: ['Denis Villeneuve', 'Christopher Nolan', 'Ridley Scott', 'Alfonso Cuarón'],
    correctAnswer: 1,
    explanation: 'Category: directors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'directors', 'scifi']
  },
  {
    id: 'movie_72',
    question: 'Who directed "Dunkirk"?',
    options: ['Steven Spielberg', 'Christopher Nolan', 'Sam Mendes', 'Ridley Scott'],
    correctAnswer: 1,
    explanation: 'Category: directors',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'directors']
  },
  {
    id: 'movie_73',
    question: 'Who directed "Arrival" (2016)?',
    options: ['Christopher Nolan', 'Denis Villeneuve', 'Alex Garland', 'Ridley Scott'],
    correctAnswer: 1,
    explanation: 'Category: directors',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'directors', 'scifi']
  },
  {
    id: 'movie_74',
    question: 'Who directed "Dune" (2021)?',
    options: ['Christopher Nolan', 'Denis Villeneuve', 'Ridley Scott', 'David Lynch'],
    correctAnswer: 1,
    explanation: 'Category: directors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'directors', 'scifi']
  },
  {
    id: 'movie_75',
    question: 'Who directed "Parasite"?',
    options: ['Park Chan-wook', 'Bong Joon-ho', 'Kim Jee-woon', 'Lee Chang-dong'],
    correctAnswer: 1,
    explanation: 'Category: directors',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'directors']
  },

  // ============================================================================
  // ACADEMY AWARDS (76-125)
  // ============================================================================
  {
    id: 'movie_76',
    question: 'Which film won Best Picture at the 2020 Oscars?',
    options: ['1917', 'Joker', 'Parasite', 'Once Upon a Time in Hollywood'],
    correctAnswer: 2,
    explanation: 'Category: awards',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'awards']
  },
  {
    id: 'movie_77',
    question: 'Who has won the most Academy Awards for Best Director?',
    options: ['Steven Spielberg', 'John Ford', 'Martin Scorsese', 'William Wyler'],
    correctAnswer: 1,
    explanation: 'Category: awards',
    difficulty: 'expert',
    category: 'movies',
    points: 3,
    tags: ['movies', 'awards', 'directors']
  },
  {
    id: 'movie_78',
    question: 'Which film holds the record for most Oscar wins?',
    options: ['Titanic', 'Ben-Hur', 'The Lord of the Rings: Return of the King', 'All three tied'],
    correctAnswer: 3,
    explanation: 'Category: awards',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'awards']
  },
  {
    id: 'movie_79',
    question: 'How many Oscars did "Titanic" win?',
    options: ['9', '10', '11', '12'],
    correctAnswer: 2,
    explanation: 'Category: awards',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'awards']
  },
  {
    id: 'movie_80',
    question: 'Who won Best Actor for "The Godfather"?',
    options: ['Al Pacino', 'Marlon Brando', 'James Caan', 'Robert Duvall'],
    correctAnswer: 1,
    explanation: 'Category: awards',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'awards', 'actors']
  },
  {
    id: 'movie_81',
    question: 'Who is the youngest Best Actress winner?',
    options: ['Tatum O\'Neal', 'Marlee Matlin', 'Anna Paquin', 'Jennifer Lawrence'],
    correctAnswer: 1,
    explanation: 'Category: awards',
    difficulty: 'expert',
    category: 'movies',
    points: 3,
    tags: ['movies', 'awards', 'actors']
  },
  {
    id: 'movie_82',
    question: 'Which actor has won the most Oscars?',
    options: ['Jack Nicholson', 'Daniel Day-Lewis', 'Katharine Hepburn', 'Meryl Streep'],
    correctAnswer: 2,
    explanation: 'Category: awards',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'awards', 'actors']
  },
  {
    id: 'movie_83',
    question: 'How many Oscars did Katharine Hepburn win?',
    options: ['2', '3', '4', '5'],
    correctAnswer: 2,
    explanation: 'Category: awards',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'awards', 'actors']
  },
  {
    id: 'movie_84',
    question: 'Which film won Best Picture in 2017?',
    options: ['La La Land', 'Moonlight', 'Manchester by the Sea', 'Arrival'],
    correctAnswer: 1,
    explanation: 'Category: awards',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'awards']
  },
  {
    id: 'movie_85',
    question: 'Who won Best Actor for "Joker" (2019)?',
    options: ['Robert De Niro', 'Joaquin Phoenix', 'Adam Driver', 'Leonardo DiCaprio'],
    correctAnswer: 1,
    explanation: 'Category: awards',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'awards', 'actors']
  },
  {
    id: 'movie_86',
    question: 'Which film won Best Picture in 2019?',
    options: ['1917', 'Joker', 'Parasite', 'Once Upon a Time in Hollywood'],
    correctAnswer: 2,
    explanation: 'Category: awards',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'awards']
  },
  {
    id: 'movie_87',
    question: 'Who won Best Director for "The Shape of Water"?',
    options: ['Christopher Nolan', 'Guillermo del Toro', 'Denis Villeneuve', 'Jordan Peele'],
    correctAnswer: 1,
    explanation: 'Category: awards',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'awards', 'directors']
  },
  {
    id: 'movie_88',
    question: 'Leonardo DiCaprio won his first Oscar for which film?',
    options: ['The Wolf of Wall Street', 'The Revenant', 'Django Unchained', 'Inception'],
    correctAnswer: 1,
    explanation: 'Category: awards',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'awards', 'actors']
  },
  {
    id: 'movie_89',
    question: 'Which animated film won Best Picture?',
    options: ['Toy Story 3', 'Up', 'None have won', 'WALL-E'],
    correctAnswer: 2,
    explanation: 'Category: awards',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'awards', 'animation']
  },
  {
    id: 'movie_90',
    question: 'Who won Best Actress for "Black Swan"?',
    options: ['Mila Kunis', 'Natalie Portman', 'Winona Ryder', 'Barbara Hershey'],
    correctAnswer: 1,
    explanation: 'Category: awards',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'awards', 'actors']
  },
  {
    id: 'movie_91',
    question: 'Which film won Best Picture in 2023?',
    options: ['Everything Everywhere All at Once', 'The Banshees of Inisherin', 'Top Gun: Maverick', 'Avatar: The Way of Water'],
    correctAnswer: 0,
    explanation: 'Category: awards',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'awards']
  },
  {
    id: 'movie_92',
    question: 'Who won Best Actor for "The Silence of the Lambs"?',
    options: ['Jodie Foster', 'Anthony Hopkins', 'Scott Glenn', 'Ted Levine'],
    correctAnswer: 1,
    explanation: 'Category: awards',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'awards', 'actors']
  },
  {
    id: 'movie_93',
    question: 'Which film won Best Picture in 2024?',
    options: ['Oppenheimer', 'Barbie', 'Killers of the Flower Moon', 'Poor Things'],
    correctAnswer: 0,
    explanation: 'Category: awards',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'awards']
  },
  {
    id: 'movie_94',
    question: 'Who won Best Director for "Oppenheimer"?',
    options: ['Martin Scorsese', 'Christopher Nolan', 'Greta Gerwig', 'Yorgos Lanthimos'],
    correctAnswer: 1,
    explanation: 'Category: awards',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'awards', 'directors']
  },
  {
    id: 'movie_95',
    question: 'Who won Best Actor for "Oppenheimer"?',
    options: ['Robert Downey Jr.', 'Cillian Murphy', 'Matt Damon', 'Josh Hartnett'],
    correctAnswer: 1,
    explanation: 'Category: awards',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'awards', 'actors']
  },


  // ============================================================================
  // FAMOUS QUOTES (96-145)
  // ============================================================================
  {
    id: 'movie_96',
    question: '"I\'ll be back" is from which movie?',
    options: ['Predator', 'The Terminator', 'Total Recall', 'Commando'],
    correctAnswer: 1,
    explanation: 'Category: quotes',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'quotes']
  },
  {
    id: 'movie_97',
    question: '"May the Force be with you" is from which franchise?',
    options: ['Star Trek', 'Star Wars', 'Battlestar Galactica', 'Stargate'],
    correctAnswer: 1,
    explanation: 'Category: quotes',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'quotes', 'scifi']
  },
  {
    id: 'movie_98',
    question: '"You talking to me?" is from which movie?',
    options: ['Goodfellas', 'Taxi Driver', 'Raging Bull', 'Mean Streets'],
    correctAnswer: 1,
    explanation: 'Category: quotes',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'quotes']
  },
  {
    id: 'movie_99',
    question: '"I\'m gonna make him an offer he can\'t refuse" is from?',
    options: ['Scarface', 'The Godfather', 'Goodfellas', 'Casino'],
    correctAnswer: 1,
    explanation: 'Category: quotes',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'quotes']
  },
  {
    id: 'movie_100',
    question: '"Here\'s Johnny!" is from which movie?',
    options: ['Psycho', 'The Shining', 'A Nightmare on Elm Street', 'Halloween'],
    correctAnswer: 1,
    explanation: 'Category: quotes',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'quotes', 'horror']
  },
  {
    id: 'movie_101',
    question: '"You can\'t handle the truth!" is from which movie?',
    options: ['The Firm', 'A Few Good Men', 'Jerry Maguire', 'Top Gun'],
    correctAnswer: 1,
    explanation: 'Category: quotes',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'quotes']
  },
  {
    id: 'movie_102',
    question: '"Life is like a box of chocolates" is from?',
    options: ['Big', 'Forrest Gump', 'Cast Away', 'The Green Mile'],
    correctAnswer: 1,
    explanation: 'Category: quotes',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'quotes']
  },
  {
    id: 'movie_103',
    question: '"I see dead people" is from which movie?',
    options: ['The Others', 'The Sixth Sense', 'Ghost', 'Poltergeist'],
    correctAnswer: 1,
    explanation: 'Category: quotes',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'quotes']
  },
  {
    id: 'movie_104',
    question: '"Why so serious?" is from which movie?',
    options: ['Batman Begins', 'The Dark Knight', 'The Dark Knight Rises', 'Joker'],
    correctAnswer: 1,
    explanation: 'Category: quotes',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'quotes']
  },
  {
    id: 'movie_105',
    question: '"I am your father" is from which Star Wars film?',
    options: ['A New Hope', 'The Empire Strikes Back', 'Return of the Jedi', 'Revenge of the Sith'],
    correctAnswer: 1,
    explanation: 'Category: quotes',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'quotes', 'scifi']
  },
  {
    id: 'movie_106',
    question: '"To infinity and beyond!" is from which movie?',
    options: ['Toy Story', 'WALL-E', 'Up', 'Finding Nemo'],
    correctAnswer: 0,
    explanation: 'Category: quotes',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'quotes', 'animation']
  },
  {
    id: 'movie_107',
    question: '"My precious" is from which franchise?',
    options: ['Harry Potter', 'The Lord of the Rings', 'The Hobbit', 'Chronicles of Narnia'],
    correctAnswer: 1,
    explanation: 'Category: quotes',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'quotes', 'fantasy']
  },
  {
    id: 'movie_108',
    question: '"I\'m the king of the world!" is from which movie?',
    options: ['The Wolf of Wall Street', 'Titanic', 'Catch Me If You Can', 'The Aviator'],
    correctAnswer: 1,
    explanation: 'Category: quotes',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'quotes']
  },
  {
    id: 'movie_109',
    question: '"Say hello to my little friend!" is from which movie?',
    options: ['The Godfather', 'Scarface', 'Goodfellas', 'Casino'],
    correctAnswer: 1,
    explanation: 'Category: quotes',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'quotes']
  },
  {
    id: 'movie_110',
    question: '"You shall not pass!" is from which movie?',
    options: ['Harry Potter', 'The Lord of the Rings', 'The Hobbit', 'Willow'],
    correctAnswer: 1,
    explanation: 'Category: quotes',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'quotes', 'fantasy']
  },
  {
    id: 'movie_111',
    question: '"I\'ll have what she\'s having" is from which movie?',
    options: ['Sleepless in Seattle', 'When Harry Met Sally', 'You\'ve Got Mail', 'Pretty Woman'],
    correctAnswer: 1,
    explanation: 'Category: quotes',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'quotes']
  },
  {
    id: 'movie_112',
    question: '"Houston, we have a problem" is from which movie?',
    options: ['Gravity', 'Apollo 13', 'The Martian', 'Interstellar'],
    correctAnswer: 1,
    explanation: 'Category: quotes',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'quotes']
  },
  {
    id: 'movie_113',
    question: '"There\'s no place like home" is from which movie?',
    options: ['E.T.', 'The Wizard of Oz', 'Home Alone', 'It\'s a Wonderful Life'],
    correctAnswer: 1,
    explanation: 'Category: quotes',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'quotes', 'classic']
  },
  {
    id: 'movie_114',
    question: '"Frankly, my dear, I don\'t give a damn" is from?',
    options: ['Casablanca', 'Gone with the Wind', 'The Maltese Falcon', 'Citizen Kane'],
    correctAnswer: 1,
    explanation: 'Category: quotes',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'quotes', 'classic']
  },
  {
    id: 'movie_115',
    question: '"I am Groot" is from which franchise?',
    options: ['Star Wars', 'Guardians of the Galaxy', 'Avatar', 'Thor'],
    correctAnswer: 1,
    explanation: 'Category: quotes',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'quotes', 'mcu']
  },

  // ============================================================================
  // HORROR MOVIES (116-165)
  // ============================================================================
  {
    id: 'movie_116',
    question: 'What year was "The Exorcist" released?',
    options: ['1971', '1973', '1975', '1977'],
    correctAnswer: 1,
    explanation: 'Category: horror',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'horror']
  },
  {
    id: 'movie_117',
    question: 'Who directed "Halloween" (1978)?',
    options: ['Wes Craven', 'John Carpenter', 'Tobe Hooper', 'George Romero'],
    correctAnswer: 1,
    explanation: 'Category: horror',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'horror', 'directors']
  },
  {
    id: 'movie_118',
    question: 'What is the killer\'s name in "Halloween"?',
    options: ['Jason Voorhees', 'Michael Myers', 'Freddy Krueger', 'Leatherface'],
    correctAnswer: 1,
    explanation: 'Category: horror',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'horror']
  },
  {
    id: 'movie_119',
    question: 'What is the killer\'s name in "Friday the 13th"?',
    options: ['Michael Myers', 'Jason Voorhees', 'Freddy Krueger', 'Ghostface'],
    correctAnswer: 1,
    explanation: 'Category: horror',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'horror']
  },
  {
    id: 'movie_120',
    question: 'Who created "A Nightmare on Elm Street"?',
    options: ['John Carpenter', 'Wes Craven', 'Tobe Hooper', 'Sam Raimi'],
    correctAnswer: 1,
    explanation: 'Category: horror',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'horror', 'directors']
  },

  {
    id: 'movie_121',
    question: 'What is Freddy Krueger\'s weapon of choice?',
    options: ['Machete', 'Chainsaw', 'Glove with blades', 'Axe'],
    correctAnswer: 2,
    explanation: 'Category: horror',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'horror']
  },
  {
    id: 'movie_122',
    question: 'Who directed "Get Out"?',
    options: ['Ari Aster', 'Jordan Peele', 'James Wan', 'Mike Flanagan'],
    correctAnswer: 1,
    explanation: 'Category: horror',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'horror', 'directors']
  },
  {
    id: 'movie_123',
    question: 'What year was "Get Out" released?',
    options: ['2015', '2017', '2019', '2021'],
    correctAnswer: 1,
    explanation: 'Category: horror',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'horror']
  },
  {
    id: 'movie_124',
    question: 'Who directed "Hereditary"?',
    options: ['Jordan Peele', 'Ari Aster', 'Robert Eggers', 'Mike Flanagan'],
    correctAnswer: 1,
    explanation: 'Category: horror',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'horror', 'directors']
  },
  {
    id: 'movie_125',
    question: 'What is the name of the demon in "The Conjuring"?',
    options: ['Pazuzu', 'Valak', 'Annabelle', 'Bagul'],
    correctAnswer: 1,
    explanation: 'Category: horror',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'horror']
  },
  {
    id: 'movie_126',
    question: 'Who directed "The Conjuring"?',
    options: ['James Wan', 'Leigh Whannell', 'Mike Flanagan', 'Scott Derrickson'],
    correctAnswer: 0,
    explanation: 'Category: horror',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'horror', 'directors']
  },
  {
    id: 'movie_127',
    question: 'What hotel is "The Shining" set in?',
    options: ['Bates Motel', 'The Overlook Hotel', 'The Stanley Hotel', 'The Grand Budapest'],
    correctAnswer: 1,
    explanation: 'Category: horror',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'horror']
  },
  {
    id: 'movie_128',
    question: 'Who played Jack Torrance in "The Shining"?',
    options: ['Robert De Niro', 'Jack Nicholson', 'Al Pacino', 'Dustin Hoffman'],
    correctAnswer: 1,
    explanation: 'Category: horror',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'horror', 'actors']
  },
  {
    id: 'movie_129',
    question: 'What is the name of the killer in "Scream"?',
    options: ['Michael Myers', 'Jason', 'Ghostface', 'The Creeper'],
    correctAnswer: 2,
    explanation: 'Category: horror',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'horror']
  },
  {
    id: 'movie_130',
    question: 'Who directed "Scream" (1996)?',
    options: ['John Carpenter', 'Wes Craven', 'Sam Raimi', 'Tobe Hooper'],
    correctAnswer: 1,
    explanation: 'Category: horror',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'horror', 'directors']
  },
  {
    id: 'movie_131',
    question: 'What year was "The Ring" (American version) released?',
    options: ['2000', '2002', '2004', '2006'],
    correctAnswer: 1,
    explanation: 'Category: horror',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'horror']
  },
  {
    id: 'movie_132',
    question: 'How many days do you have after watching the tape in "The Ring"?',
    options: ['3 days', '5 days', '7 days', '10 days'],
    correctAnswer: 2,
    explanation: 'Category: horror',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'horror']
  },
  {
    id: 'movie_133',
    question: 'Who directed "It" (2017)?',
    options: ['James Wan', 'Andy Muschietti', 'Mike Flanagan', 'David F. Sandberg'],
    correctAnswer: 1,
    explanation: 'Category: horror',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'horror', 'directors']
  },
  {
    id: 'movie_134',
    question: 'What is the clown\'s name in "It"?',
    options: ['Bobo', 'Pennywise', 'Twisty', 'Art'],
    correctAnswer: 1,
    explanation: 'Category: horror',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'horror']
  },
  {
    id: 'movie_135',
    question: 'Who wrote the novel "It"?',
    options: ['Dean Koontz', 'Stephen King', 'Peter Straub', 'Clive Barker'],
    correctAnswer: 1,
    explanation: 'Category: horror',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'horror']
  },

  // ============================================================================
  // SCI-FI MOVIES (136-185)
  // ============================================================================
  {
    id: 'movie_136',
    question: 'What year was the original "Star Wars" released?',
    options: ['1975', '1977', '1979', '1981'],
    correctAnswer: 1,
    explanation: 'Category: scifi',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'scifi']
  },
  {
    id: 'movie_137',
    question: 'Who directed the original "Star Wars" trilogy?',
    options: ['Steven Spielberg', 'George Lucas', 'James Cameron', 'Ridley Scott'],
    correctAnswer: 1,
    explanation: 'Category: scifi',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'scifi', 'directors']
  },
  {
    id: 'movie_138',
    question: 'What is the name of Han Solo\'s ship?',
    options: ['X-Wing', 'Millennium Falcon', 'TIE Fighter', 'Star Destroyer'],
    correctAnswer: 1,
    explanation: 'Category: scifi',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'scifi']
  },
  {
    id: 'movie_139',
    question: 'Who played Han Solo in the original trilogy?',
    options: ['Mark Hamill', 'Harrison Ford', 'Carrie Fisher', 'Billy Dee Williams'],
    correctAnswer: 1,
    explanation: 'Category: scifi',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'scifi', 'actors']
  },
  {
    id: 'movie_140',
    question: 'What is Darth Vader\'s real name?',
    options: ['Luke Skywalker', 'Anakin Skywalker', 'Ben Solo', 'Obi-Wan Kenobi'],
    correctAnswer: 1,
    explanation: 'Category: scifi',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'scifi']
  },
  {
    id: 'movie_141',
    question: 'What year was "Blade Runner" released?',
    options: ['1980', '1982', '1984', '1986'],
    correctAnswer: 1,
    explanation: 'Category: scifi',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'scifi']
  },
  {
    id: 'movie_142',
    question: 'Who played Rick Deckard in "Blade Runner"?',
    options: ['Rutger Hauer', 'Harrison Ford', 'Sean Young', 'Edward James Olmos'],
    correctAnswer: 1,
    explanation: 'Category: scifi',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'scifi', 'actors']
  },
  {
    id: 'movie_143',
    question: 'What are the androids called in "Blade Runner"?',
    options: ['Cylons', 'Replicants', 'Androids', 'Synthetics'],
    correctAnswer: 1,
    explanation: 'Category: scifi',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'scifi']
  },
  {
    id: 'movie_144',
    question: 'What year was "Terminator 2: Judgment Day" released?',
    options: ['1989', '1991', '1993', '1995'],
    correctAnswer: 1,
    explanation: 'Category: scifi',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'scifi']
  },
  {
    id: 'movie_145',
    question: 'Who directed "The Terminator"?',
    options: ['Ridley Scott', 'James Cameron', 'Paul Verhoeven', 'John McTiernan'],
    correctAnswer: 1,
    explanation: 'Category: scifi',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'scifi', 'directors']
  },

  {
    id: 'movie_146',
    question: 'What is the AI called in "2001: A Space Odyssey"?',
    options: ['WALL-E', 'HAL 9000', 'Skynet', 'JARVIS'],
    correctAnswer: 1,
    explanation: 'Category: scifi',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'scifi']
  },
  {
    id: 'movie_147',
    question: 'What year is "Back to the Future" set in the future?',
    options: ['2010', '2015', '2020', '2025'],
    correctAnswer: 1,
    explanation: 'Category: scifi',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'scifi']
  },
  {
    id: 'movie_148',
    question: 'What car is the time machine in "Back to the Future"?',
    options: ['Corvette', 'DeLorean', 'Mustang', 'Camaro'],
    correctAnswer: 1,
    explanation: 'Category: scifi',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'scifi']
  },
  {
    id: 'movie_149',
    question: 'Who played Marty McFly in "Back to the Future"?',
    options: ['Tom Hanks', 'Michael J. Fox', 'Matthew Broderick', 'John Cusack'],
    correctAnswer: 1,
    explanation: 'Category: scifi',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'scifi', 'actors']
  },
  {
    id: 'movie_150',
    question: 'What speed must the DeLorean reach to time travel?',
    options: ['77 mph', '88 mph', '99 mph', '100 mph'],
    correctAnswer: 1,
    explanation: 'Category: scifi',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'scifi']
  },
  {
    id: 'movie_151',
    question: 'What year was "Alien" released?',
    options: ['1977', '1979', '1981', '1983'],
    correctAnswer: 1,
    explanation: 'Category: scifi',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'scifi']
  },
  {
    id: 'movie_152',
    question: 'Who played Ellen Ripley in "Alien"?',
    options: ['Jamie Lee Curtis', 'Sigourney Weaver', 'Linda Hamilton', 'Jodie Foster'],
    correctAnswer: 1,
    explanation: 'Category: scifi',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'scifi', 'actors']
  },
  {
    id: 'movie_153',
    question: 'What is the name of the ship in "Alien"?',
    options: ['Sulaco', 'Nostromo', 'Prometheus', 'Covenant'],
    correctAnswer: 1,
    explanation: 'Category: scifi',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'scifi']
  },
  {
    id: 'movie_154',
    question: 'What year was "The Fifth Element" released?',
    options: ['1995', '1997', '1999', '2001'],
    correctAnswer: 1,
    explanation: 'Category: scifi',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'scifi']
  },
  {
    id: 'movie_155',
    question: 'Who directed "The Fifth Element"?',
    options: ['Ridley Scott', 'Luc Besson', 'Paul Verhoeven', 'Roland Emmerich'],
    correctAnswer: 1,
    explanation: 'Category: scifi',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'scifi', 'directors']
  },

  // ============================================================================
  // ANIMATION (156-205)
  // ============================================================================
  {
    id: 'movie_156',
    question: 'What year was "Toy Story" released?',
    options: ['1993', '1995', '1997', '1999'],
    correctAnswer: 1,
    explanation: 'Category: animation',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'animation']
  },
  {
    id: 'movie_157',
    question: 'What studio made "Toy Story"?',
    options: ['DreamWorks', 'Pixar', 'Disney', 'Blue Sky'],
    correctAnswer: 1,
    explanation: 'Category: animation',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'animation']
  },
  {
    id: 'movie_158',
    question: 'Who voices Woody in "Toy Story"?',
    options: ['Tim Allen', 'Tom Hanks', 'Billy Crystal', 'John Goodman'],
    correctAnswer: 1,
    explanation: 'Category: animation',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'animation', 'actors']
  },
  {
    id: 'movie_159',
    question: 'Who voices Buzz Lightyear in "Toy Story"?',
    options: ['Tom Hanks', 'Tim Allen', 'Chris Evans', 'Billy Crystal'],
    correctAnswer: 1,
    explanation: 'Category: animation',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'animation', 'actors']
  },
  {
    id: 'movie_160',
    question: 'What year was "Finding Nemo" released?',
    options: ['2001', '2003', '2005', '2007'],
    correctAnswer: 1,
    explanation: 'Category: animation',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'animation']
  },
  {
    id: 'movie_161',
    question: 'What type of fish is Nemo?',
    options: ['Blue Tang', 'Clownfish', 'Goldfish', 'Angelfish'],
    correctAnswer: 1,
    explanation: 'Category: animation',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'animation']
  },
  {
    id: 'movie_162',
    question: 'What type of fish is Dory?',
    options: ['Clownfish', 'Blue Tang', 'Goldfish', 'Pufferfish'],
    correctAnswer: 1,
    explanation: 'Category: animation',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'animation']
  },
  {
    id: 'movie_163',
    question: 'Who voices Dory in "Finding Nemo"?',
    options: ['Tina Fey', 'Ellen DeGeneres', 'Amy Poehler', 'Kristen Wiig'],
    correctAnswer: 1,
    explanation: 'Category: animation',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'animation', 'actors']
  },
  {
    id: 'movie_164',
    question: 'What year was "The Lion King" (original) released?',
    options: ['1992', '1994', '1996', '1998'],
    correctAnswer: 1,
    explanation: 'Category: animation',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'animation']
  },
  {
    id: 'movie_165',
    question: 'Who voices adult Simba in "The Lion King"?',
    options: ['James Earl Jones', 'Matthew Broderick', 'Jeremy Irons', 'Nathan Lane'],
    correctAnswer: 1,
    explanation: 'Category: animation',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'animation', 'actors']
  },
  {
    id: 'movie_166',
    question: 'Who voices Mufasa in "The Lion King"?',
    options: ['Matthew Broderick', 'James Earl Jones', 'Jeremy Irons', 'Rowan Atkinson'],
    correctAnswer: 1,
    explanation: 'Category: animation',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'animation', 'actors']
  },
  {
    id: 'movie_167',
    question: 'What year was "Shrek" released?',
    options: ['1999', '2001', '2003', '2005'],
    correctAnswer: 1,
    explanation: 'Category: animation',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'animation']
  },
  {
    id: 'movie_168',
    question: 'Who voices Shrek?',
    options: ['Eddie Murphy', 'Mike Myers', 'Cameron Diaz', 'John Lithgow'],
    correctAnswer: 1,
    explanation: 'Category: animation',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'animation', 'actors']
  },
  {
    id: 'movie_169',
    question: 'Who voices Donkey in "Shrek"?',
    options: ['Mike Myers', 'Eddie Murphy', 'Antonio Banderas', 'John Lithgow'],
    correctAnswer: 1,
    explanation: 'Category: animation',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'animation', 'actors']
  },
  {
    id: 'movie_170',
    question: 'What studio made "Shrek"?',
    options: ['Pixar', 'DreamWorks', 'Disney', 'Illumination'],
    correctAnswer: 1,
    explanation: 'Category: animation',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'animation']
  },

  {
    id: 'movie_171',
    question: 'What year was "Frozen" released?',
    options: ['2011', '2013', '2015', '2017'],
    correctAnswer: 1,
    explanation: 'Category: animation',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'animation']
  },
  {
    id: 'movie_172',
    question: 'What is the famous song from "Frozen"?',
    options: ['Let It Be', 'Let It Go', 'Let It Snow', 'Let It Shine'],
    correctAnswer: 1,
    explanation: 'Category: animation',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'animation']
  },
  {
    id: 'movie_173',
    question: 'Who voices Elsa in "Frozen"?',
    options: ['Kristen Bell', 'Idina Menzel', 'Mandy Moore', 'Amy Adams'],
    correctAnswer: 1,
    explanation: 'Category: animation',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'animation', 'actors']
  },
  {
    id: 'movie_174',
    question: 'What year was "Up" released?',
    options: ['2007', '2009', '2011', '2013'],
    correctAnswer: 1,
    explanation: 'Category: animation',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'animation']
  },
  {
    id: 'movie_175',
    question: 'What is the name of the old man in "Up"?',
    options: ['Carl Fredricksen', 'Russell', 'Charles Muntz', 'Kevin'],
    correctAnswer: 0,
    explanation: 'Category: animation',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'animation']
  },
  {
    id: 'movie_176',
    question: 'What year was "WALL-E" released?',
    options: ['2006', '2008', '2010', '2012'],
    correctAnswer: 1,
    explanation: 'Category: animation',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'animation']
  },
  {
    id: 'movie_177',
    question: 'What does WALL-E stand for?',
    options: ['Waste Allocation Load Lifter Earth-class', 'World Automated Lifting Loader', 'Waste And Litter Lifter', 'None of these'],
    correctAnswer: 0,
    explanation: 'Category: animation',
    difficulty: 'expert',
    category: 'movies',
    points: 3,
    tags: ['movies', 'animation']
  },
  {
    id: 'movie_178',
    question: 'What year was "Inside Out" released?',
    options: ['2013', '2015', '2017', '2019'],
    correctAnswer: 1,
    explanation: 'Category: animation',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'animation']
  },
  {
    id: 'movie_179',
    question: 'Who voices Joy in "Inside Out"?',
    options: ['Tina Fey', 'Amy Poehler', 'Mindy Kaling', 'Phyllis Smith'],
    correctAnswer: 1,
    explanation: 'Category: animation',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'animation', 'actors']
  },
  {
    id: 'movie_180',
    question: 'What year was "Coco" released?',
    options: ['2015', '2017', '2019', '2021'],
    correctAnswer: 1,
    explanation: 'Category: animation',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'animation']
  },

  // ============================================================================
  // FRANCHISES & SEQUELS (181-230)
  // ============================================================================
  {
    id: 'movie_181',
    question: 'How many "Harry Potter" films are there?',
    options: ['6', '7', '8', '9'],
    correctAnswer: 2,
    explanation: 'Category: franchise',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'franchise', 'fantasy']
  },
  {
    id: 'movie_182',
    question: 'Who plays Harry Potter?',
    options: ['Rupert Grint', 'Daniel Radcliffe', 'Tom Felton', 'Matthew Lewis'],
    correctAnswer: 1,
    explanation: 'Category: franchise',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'franchise', 'actors']
  },
  {
    id: 'movie_183',
    question: 'What year was the first "Harry Potter" film released?',
    options: ['1999', '2001', '2003', '2005'],
    correctAnswer: 1,
    explanation: 'Category: franchise',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'franchise']
  },
  {
    id: 'movie_184',
    question: 'How many "Lord of the Rings" films are in the original trilogy?',
    options: ['2', '3', '4', '5'],
    correctAnswer: 1,
    explanation: 'Category: franchise',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'franchise', 'fantasy']
  },
  {
    id: 'movie_185',
    question: 'Who plays Frodo in "Lord of the Rings"?',
    options: ['Sean Astin', 'Elijah Wood', 'Billy Boyd', 'Dominic Monaghan'],
    correctAnswer: 1,
    explanation: 'Category: franchise',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'franchise', 'actors']
  },
  {
    id: 'movie_186',
    question: 'Who plays Gandalf in "Lord of the Rings"?',
    options: ['Christopher Lee', 'Ian McKellen', 'Michael Gambon', 'Patrick Stewart'],
    correctAnswer: 1,
    explanation: 'Category: franchise',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'franchise', 'actors']
  },
  {
    id: 'movie_187',
    question: 'How many "Fast & Furious" main films are there (as of 2023)?',
    options: ['8', '9', '10', '11'],
    correctAnswer: 2,
    explanation: 'Category: franchise',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'franchise']
  },
  {
    id: 'movie_188',
    question: 'Who plays Dominic Toretto in "Fast & Furious"?',
    options: ['Paul Walker', 'Vin Diesel', 'Dwayne Johnson', 'Jason Statham'],
    correctAnswer: 1,
    explanation: 'Category: franchise',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'franchise', 'actors']
  },
  {
    id: 'movie_189',
    question: 'How many "Mission: Impossible" films are there (as of 2023)?',
    options: ['5', '6', '7', '8'],
    correctAnswer: 2,
    explanation: 'Category: franchise',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'franchise']
  },
  {
    id: 'movie_190',
    question: 'Who plays Ethan Hunt in "Mission: Impossible"?',
    options: ['Matt Damon', 'Tom Cruise', 'Brad Pitt', 'George Clooney'],
    correctAnswer: 1,
    explanation: 'Category: franchise',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'franchise', 'actors']
  },
  {
    id: 'movie_191',
    question: 'How many "James Bond" films are there (official)?',
    options: ['20', '23', '25', '27'],
    correctAnswer: 2,
    explanation: 'Category: franchise',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'franchise']
  },
  {
    id: 'movie_192',
    question: 'Who was the first actor to play James Bond?',
    options: ['Roger Moore', 'Sean Connery', 'George Lazenby', 'David Niven'],
    correctAnswer: 1,
    explanation: 'Category: franchise',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'franchise', 'actors']
  },
  {
    id: 'movie_193',
    question: 'Who is the most recent James Bond actor?',
    options: ['Pierce Brosnan', 'Daniel Craig', 'Timothy Dalton', 'Roger Moore'],
    correctAnswer: 1,
    explanation: 'Category: franchise',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'franchise', 'actors']
  },
  {
    id: 'movie_194',
    question: 'How many "Pirates of the Caribbean" films are there?',
    options: ['4', '5', '6', '7'],
    correctAnswer: 1,
    explanation: 'Category: franchise',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'franchise']
  },
  {
    id: 'movie_195',
    question: 'Who plays Captain Jack Sparrow?',
    options: ['Orlando Bloom', 'Johnny Depp', 'Geoffrey Rush', 'Javier Bardem'],
    correctAnswer: 1,
    explanation: 'Category: franchise',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'franchise', 'actors']
  },


  // ============================================================================
  // MCU / MARVEL (196-245)
  // ============================================================================
  {
    id: 'movie_196',
    question: 'What was the first MCU film?',
    options: ['The Incredible Hulk', 'Iron Man', 'Thor', 'Captain America'],
    correctAnswer: 1,
    explanation: 'Category: mcu',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'mcu']
  },
  {
    id: 'movie_197',
    question: 'Who plays Captain America?',
    options: ['Chris Hemsworth', 'Chris Evans', 'Chris Pratt', 'Robert Downey Jr.'],
    correctAnswer: 1,
    explanation: 'Category: mcu',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'mcu', 'actors']
  },
  {
    id: 'movie_198',
    question: 'Who plays Thor?',
    options: ['Chris Evans', 'Chris Hemsworth', 'Chris Pratt', 'Tom Hiddleston'],
    correctAnswer: 1,
    explanation: 'Category: mcu',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'mcu', 'actors']
  },
  {
    id: 'movie_199',
    question: 'Who plays Star-Lord in "Guardians of the Galaxy"?',
    options: ['Chris Evans', 'Chris Hemsworth', 'Chris Pratt', 'Dave Bautista'],
    correctAnswer: 2,
    explanation: 'Category: mcu',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'mcu', 'actors']
  },
  {
    id: 'movie_200',
    question: 'What is the name of Thor\'s brother?',
    options: ['Odin', 'Loki', 'Heimdall', 'Baldur'],
    correctAnswer: 1,
    explanation: 'Category: mcu',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'mcu']
  },
  {
    id: 'movie_201',
    question: 'Who plays Loki?',
    options: ['Chris Hemsworth', 'Tom Hiddleston', 'Idris Elba', 'Anthony Hopkins'],
    correctAnswer: 1,
    explanation: 'Category: mcu',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'mcu', 'actors']
  },
  {
    id: 'movie_202',
    question: 'What year was "The Avengers" released?',
    options: ['2010', '2012', '2014', '2016'],
    correctAnswer: 1,
    explanation: 'Category: mcu',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'mcu']
  },
  {
    id: 'movie_203',
    question: 'Who directed "The Avengers" (2012)?',
    options: ['The Russo Brothers', 'Joss Whedon', 'Jon Favreau', 'James Gunn'],
    correctAnswer: 1,
    explanation: 'Category: mcu',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'mcu', 'directors']
  },
  {
    id: 'movie_204',
    question: 'What is the name of the villain in "The Avengers"?',
    options: ['Thanos', 'Ultron', 'Loki', 'Red Skull'],
    correctAnswer: 2,
    explanation: 'Category: mcu',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'mcu']
  },
  {
    id: 'movie_205',
    question: 'Who plays Black Widow?',
    options: ['Gal Gadot', 'Scarlett Johansson', 'Elizabeth Olsen', 'Brie Larson'],
    correctAnswer: 1,
    explanation: 'Category: mcu',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'mcu', 'actors']
  },
  {
    id: 'movie_206',
    question: 'Who plays the Hulk in the MCU (post-2012)?',
    options: ['Edward Norton', 'Mark Ruffalo', 'Eric Bana', 'Lou Ferrigno'],
    correctAnswer: 1,
    explanation: 'Category: mcu',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'mcu', 'actors']
  },
  {
    id: 'movie_207',
    question: 'What year was "Avengers: Endgame" released?',
    options: ['2017', '2018', '2019', '2020'],
    correctAnswer: 2,
    explanation: 'Category: mcu',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'mcu']
  },
  {
    id: 'movie_208',
    question: 'Who is the main villain in "Avengers: Infinity War"?',
    options: ['Ultron', 'Loki', 'Thanos', 'Hela'],
    correctAnswer: 2,
    explanation: 'Category: mcu',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'mcu']
  },
  {
    id: 'movie_209',
    question: 'Who plays Thanos?',
    options: ['James Brolin', 'Josh Brolin', 'Jeff Bridges', 'Michael Douglas'],
    correctAnswer: 1,
    explanation: 'Category: mcu',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'mcu', 'actors']
  },
  {
    id: 'movie_210',
    question: 'How many Infinity Stones are there?',
    options: ['4', '5', '6', '7'],
    correctAnswer: 2,
    explanation: 'Category: mcu',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'mcu']
  },
  {
    id: 'movie_211',
    question: 'Who plays Spider-Man in the MCU?',
    options: ['Tobey Maguire', 'Andrew Garfield', 'Tom Holland', 'Miles Morales'],
    correctAnswer: 2,
    explanation: 'Category: mcu',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'mcu', 'actors']
  },
  {
    id: 'movie_212',
    question: 'Who plays Doctor Strange?',
    options: ['Robert Downey Jr.', 'Benedict Cumberbatch', 'Tom Hiddleston', 'Paul Bettany'],
    correctAnswer: 1,
    explanation: 'Category: mcu',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'mcu', 'actors']
  },
  {
    id: 'movie_213',
    question: 'Who plays Black Panther?',
    options: ['Michael B. Jordan', 'Chadwick Boseman', 'Daniel Kaluuya', 'Letitia Wright'],
    correctAnswer: 1,
    explanation: 'Category: mcu',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'mcu', 'actors']
  },
  {
    id: 'movie_214',
    question: 'What is the name of Black Panther\'s country?',
    options: ['Genosha', 'Wakanda', 'Latveria', 'Sokovia'],
    correctAnswer: 1,
    explanation: 'Category: mcu',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'mcu']
  },
  {
    id: 'movie_215',
    question: 'Who plays Captain Marvel?',
    options: ['Gal Gadot', 'Scarlett Johansson', 'Brie Larson', 'Elizabeth Olsen'],
    correctAnswer: 2,
    explanation: 'Category: mcu',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'mcu', 'actors']
  },

  // ============================================================================
  // ACTORS & ACTRESSES (216-265)
  // ============================================================================
  {
    id: 'movie_216',
    question: 'Who has won the most Academy Awards for acting?',
    options: ['Meryl Streep', 'Katharine Hepburn', 'Jack Nicholson', 'Daniel Day-Lewis'],
    correctAnswer: 1,
    explanation: 'Category: actors',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'actors', 'awards']
  },
  {
    id: 'movie_217',
    question: 'Who played the Joker in "Joker" (2019)?',
    options: ['Heath Ledger', 'Jared Leto', 'Joaquin Phoenix', 'Jack Nicholson'],
    correctAnswer: 2,
    explanation: 'Category: actors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'actors']
  },
  {
    id: 'movie_218',
    question: 'Who played Forrest Gump?',
    options: ['Robin Williams', 'Tom Hanks', 'Jim Carrey', 'Kevin Costner'],
    correctAnswer: 1,
    explanation: 'Category: actors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'actors']
  },
  {
    id: 'movie_219',
    question: 'Who played the lead in "Gladiator"?',
    options: ['Brad Pitt', 'Russell Crowe', 'Gerard Butler', 'Mel Gibson'],
    correctAnswer: 1,
    explanation: 'Category: actors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'actors']
  },
  {
    id: 'movie_220',
    question: 'Who played John Wick?',
    options: ['Liam Neeson', 'Keanu Reeves', 'Jason Statham', 'Tom Cruise'],
    correctAnswer: 1,
    explanation: 'Category: actors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'actors']
  },

  {
    id: 'movie_221',
    question: 'Who played the lead in "The Shawshank Redemption"?',
    options: ['Morgan Freeman', 'Tim Robbins', 'Clint Eastwood', 'Kevin Bacon'],
    correctAnswer: 1,
    explanation: 'Category: actors',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'actors']
  },
  {
    id: 'movie_222',
    question: 'Who played Tyler Durden in "Fight Club"?',
    options: ['Edward Norton', 'Brad Pitt', 'Jared Leto', 'Meat Loaf'],
    correctAnswer: 1,
    explanation: 'Category: actors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'actors']
  },
  {
    id: 'movie_223',
    question: 'Who played Hannibal Lecter in "The Silence of the Lambs"?',
    options: ['Robert De Niro', 'Anthony Hopkins', 'Gary Oldman', 'Mads Mikkelsen'],
    correctAnswer: 1,
    explanation: 'Category: actors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'actors']
  },
  {
    id: 'movie_224',
    question: 'Who played the lead in "Cast Away"?',
    options: ['Tom Hanks', 'Matt Damon', 'Leonardo DiCaprio', 'Russell Crowe'],
    correctAnswer: 0,
    explanation: 'Category: actors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'actors']
  },
  {
    id: 'movie_225',
    question: 'Who played the lead in "The Bourne Identity"?',
    options: ['Tom Cruise', 'Matt Damon', 'Brad Pitt', 'George Clooney'],
    correctAnswer: 1,
    explanation: 'Category: actors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'actors']
  },
  {
    id: 'movie_226',
    question: 'Who played Wolverine in the X-Men films?',
    options: ['Chris Hemsworth', 'Hugh Jackman', 'Ryan Reynolds', 'Patrick Stewart'],
    correctAnswer: 1,
    explanation: 'Category: actors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'actors']
  },
  {
    id: 'movie_227',
    question: 'Who played Deadpool?',
    options: ['Hugh Jackman', 'Ryan Reynolds', 'Chris Pratt', 'Ryan Gosling'],
    correctAnswer: 1,
    explanation: 'Category: actors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'actors']
  },
  {
    id: 'movie_228',
    question: 'Who played Wonder Woman?',
    options: ['Scarlett Johansson', 'Gal Gadot', 'Brie Larson', 'Margot Robbie'],
    correctAnswer: 1,
    explanation: 'Category: actors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'actors']
  },
  {
    id: 'movie_229',
    question: 'Who played Harley Quinn in "Suicide Squad"?',
    options: ['Gal Gadot', 'Margot Robbie', 'Cara Delevingne', 'Karen Fukuhara'],
    correctAnswer: 1,
    explanation: 'Category: actors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'actors']
  },
  {
    id: 'movie_230',
    question: 'Who played the lead in "The Wolf of Wall Street"?',
    options: ['Brad Pitt', 'Leonardo DiCaprio', 'Matt Damon', 'Christian Bale'],
    correctAnswer: 1,
    explanation: 'Category: actors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'actors']
  },
  {
    id: 'movie_231',
    question: 'Who played the lead in "Django Unchained"?',
    options: ['Leonardo DiCaprio', 'Jamie Foxx', 'Christoph Waltz', 'Samuel L. Jackson'],
    correctAnswer: 1,
    explanation: 'Category: actors',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'actors']
  },
  {
    id: 'movie_232',
    question: 'Who played the lead in "Inception"?',
    options: ['Tom Hardy', 'Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Cillian Murphy'],
    correctAnswer: 1,
    explanation: 'Category: actors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'actors']
  },
  {
    id: 'movie_233',
    question: 'Who played the lead in "Interstellar"?',
    options: ['Matt Damon', 'Matthew McConaughey', 'Christian Bale', 'Michael Caine'],
    correctAnswer: 1,
    explanation: 'Category: actors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'actors']
  },
  {
    id: 'movie_234',
    question: 'Who played the lead in "The Martian"?',
    options: ['Matt Damon', 'Ryan Gosling', 'Brad Pitt', 'George Clooney'],
    correctAnswer: 0,
    explanation: 'Category: actors',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'actors']
  },
  {
    id: 'movie_235',
    question: 'Who played the lead in "Gravity"?',
    options: ['Anne Hathaway', 'Sandra Bullock', 'Natalie Portman', 'Amy Adams'],
    correctAnswer: 1,
    explanation: 'Category: actors',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'actors']
  },

  // ============================================================================
  // 90s MOVIES (236-285)
  // ============================================================================
  {
    id: 'movie_236',
    question: 'What year was "The Shawshank Redemption" released?',
    options: ['1992', '1994', '1996', '1998'],
    correctAnswer: 1,
    explanation: 'Category: 90s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '90s']
  },
  {
    id: 'movie_237',
    question: 'What year was "Pulp Fiction" released?',
    options: ['1992', '1994', '1996', '1998'],
    correctAnswer: 1,
    explanation: 'Category: 90s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '90s']
  },
  {
    id: 'movie_238',
    question: 'What year was "Forrest Gump" released?',
    options: ['1992', '1994', '1996', '1998'],
    correctAnswer: 1,
    explanation: 'Category: 90s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '90s']
  },
  {
    id: 'movie_239',
    question: 'What year was "Fight Club" released?',
    options: ['1997', '1999', '2001', '2003'],
    correctAnswer: 1,
    explanation: 'Category: 90s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '90s']
  },
  {
    id: 'movie_240',
    question: 'What year was "The Sixth Sense" released?',
    options: ['1997', '1999', '2001', '2003'],
    correctAnswer: 1,
    explanation: 'Category: 90s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '90s']
  },
  {
    id: 'movie_241',
    question: 'What year was "Goodfellas" released?',
    options: ['1988', '1990', '1992', '1994'],
    correctAnswer: 1,
    explanation: 'Category: 90s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '90s']
  },
  {
    id: 'movie_242',
    question: 'What year was "Se7en" released?',
    options: ['1993', '1995', '1997', '1999'],
    correctAnswer: 1,
    explanation: 'Category: 90s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '90s']
  },
  {
    id: 'movie_243',
    question: 'What year was "The Silence of the Lambs" released?',
    options: ['1989', '1991', '1993', '1995'],
    correctAnswer: 1,
    explanation: 'Category: 90s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '90s']
  },
  {
    id: 'movie_244',
    question: 'What year was "Saving Private Ryan" released?',
    options: ['1996', '1998', '2000', '2002'],
    correctAnswer: 1,
    explanation: 'Category: 90s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '90s']
  },
  {
    id: 'movie_245',
    question: 'What year was "The Green Mile" released?',
    options: ['1997', '1999', '2001', '2003'],
    correctAnswer: 1,
    explanation: 'Category: 90s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '90s']
  },

  {
    id: 'movie_246',
    question: 'What year was "American Beauty" released?',
    options: ['1997', '1999', '2001', '2003'],
    correctAnswer: 1,
    explanation: 'Category: 90s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '90s']
  },
  {
    id: 'movie_247',
    question: 'What year was "Braveheart" released?',
    options: ['1993', '1995', '1997', '1999'],
    correctAnswer: 1,
    explanation: 'Category: 90s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '90s']
  },
  {
    id: 'movie_248',
    question: 'Who directed "Braveheart"?',
    options: ['Ridley Scott', 'Mel Gibson', 'Kevin Costner', 'Ron Howard'],
    correctAnswer: 1,
    explanation: 'Category: 90s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '90s', 'directors']
  },
  {
    id: 'movie_249',
    question: 'What year was "Schindler\'s List" released?',
    options: ['1991', '1993', '1995', '1997'],
    correctAnswer: 1,
    explanation: 'Category: 90s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '90s']
  },
  {
    id: 'movie_250',
    question: 'What year was "The Big Lebowski" released?',
    options: ['1996', '1998', '2000', '2002'],
    correctAnswer: 1,
    explanation: 'Category: 90s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '90s']
  },

  // ============================================================================
  // 2000s MOVIES (251-300)
  // ============================================================================
  {
    id: 'movie_251',
    question: 'What year was "Gladiator" released?',
    options: ['1998', '2000', '2002', '2004'],
    correctAnswer: 1,
    explanation: 'Category: 2000s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '2000s']
  },
  {
    id: 'movie_252',
    question: 'What year was "The Lord of the Rings: Fellowship" released?',
    options: ['1999', '2001', '2003', '2005'],
    correctAnswer: 1,
    explanation: 'Category: 2000s',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', '2000s', 'fantasy']
  },
  {
    id: 'movie_253',
    question: 'What year was "The Lord of the Rings: Return of the King" released?',
    options: ['2001', '2003', '2005', '2007'],
    correctAnswer: 1,
    explanation: 'Category: 2000s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '2000s', 'fantasy']
  },
  {
    id: 'movie_254',
    question: 'What year was "Kill Bill: Volume 1" released?',
    options: ['2001', '2003', '2005', '2007'],
    correctAnswer: 1,
    explanation: 'Category: 2000s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '2000s']
  },
  {
    id: 'movie_255',
    question: 'What year was "The Departed" released?',
    options: ['2004', '2006', '2008', '2010'],
    correctAnswer: 1,
    explanation: 'Category: 2000s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '2000s']
  },
  {
    id: 'movie_256',
    question: 'What year was "No Country for Old Men" released?',
    options: ['2005', '2007', '2009', '2011'],
    correctAnswer: 1,
    explanation: 'Category: 2000s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '2000s']
  },
  {
    id: 'movie_257',
    question: 'What year was "There Will Be Blood" released?',
    options: ['2005', '2007', '2009', '2011'],
    correctAnswer: 1,
    explanation: 'Category: 2000s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '2000s']
  },
  {
    id: 'movie_258',
    question: 'What year was "Memento" released?',
    options: ['1998', '2000', '2002', '2004'],
    correctAnswer: 1,
    explanation: 'Category: 2000s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '2000s']
  },
  {
    id: 'movie_259',
    question: 'Who directed "Memento"?',
    options: ['David Fincher', 'Christopher Nolan', 'Darren Aronofsky', 'Denis Villeneuve'],
    correctAnswer: 1,
    explanation: 'Category: 2000s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '2000s', 'directors']
  },
  {
    id: 'movie_260',
    question: 'What year was "Eternal Sunshine of the Spotless Mind" released?',
    options: ['2002', '2004', '2006', '2008'],
    correctAnswer: 1,
    explanation: 'Category: 2000s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '2000s']
  },

  // ============================================================================
  // 2010s MOVIES (261-310)
  // ============================================================================
  {
    id: 'movie_261',
    question: 'What year was "Inception" released?',
    options: ['2008', '2010', '2012', '2014'],
    correctAnswer: 1,
    explanation: 'Category: 2010s',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', '2010s']
  },
  {
    id: 'movie_262',
    question: 'What year was "The Social Network" released?',
    options: ['2008', '2010', '2012', '2014'],
    correctAnswer: 1,
    explanation: 'Category: 2010s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '2010s']
  },
  {
    id: 'movie_263',
    question: 'What year was "Black Swan" released?',
    options: ['2008', '2010', '2012', '2014'],
    correctAnswer: 1,
    explanation: 'Category: 2010s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '2010s']
  },
  {
    id: 'movie_264',
    question: 'What year was "Django Unchained" released?',
    options: ['2010', '2012', '2014', '2016'],
    correctAnswer: 1,
    explanation: 'Category: 2010s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '2010s']
  },
  {
    id: 'movie_265',
    question: 'What year was "Gravity" released?',
    options: ['2011', '2013', '2015', '2017'],
    correctAnswer: 1,
    explanation: 'Category: 2010s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '2010s']
  },
  {
    id: 'movie_266',
    question: 'What year was "12 Years a Slave" released?',
    options: ['2011', '2013', '2015', '2017'],
    correctAnswer: 1,
    explanation: 'Category: 2010s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '2010s']
  },
  {
    id: 'movie_267',
    question: 'What year was "Interstellar" released?',
    options: ['2012', '2014', '2016', '2018'],
    correctAnswer: 1,
    explanation: 'Category: 2010s',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', '2010s']
  },
  {
    id: 'movie_268',
    question: 'What year was "Mad Max: Fury Road" released?',
    options: ['2013', '2015', '2017', '2019'],
    correctAnswer: 1,
    explanation: 'Category: 2010s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '2010s']
  },
  {
    id: 'movie_269',
    question: 'What year was "The Revenant" released?',
    options: ['2013', '2015', '2017', '2019'],
    correctAnswer: 1,
    explanation: 'Category: 2010s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '2010s']
  },
  {
    id: 'movie_270',
    question: 'What year was "La La Land" released?',
    options: ['2014', '2016', '2018', '2020'],
    correctAnswer: 1,
    explanation: 'Category: 2010s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '2010s']
  },


  // ============================================================================
  // 2020s MOVIES (271-320)
  // ============================================================================
  {
    id: 'movie_271',
    question: 'What year was "Dune" (Part One) released?',
    options: ['2019', '2021', '2023', '2025'],
    correctAnswer: 1,
    explanation: 'Category: 2020s',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', '2020s']
  },
  {
    id: 'movie_272',
    question: 'What year was "Dune: Part Two" released?',
    options: ['2022', '2024', '2025', '2026'],
    correctAnswer: 1,
    explanation: 'Category: 2020s',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', '2020s']
  },
  {
    id: 'movie_273',
    question: 'Who plays Paul Atreides in "Dune"?',
    options: ['Tom Holland', 'Timothée Chalamet', 'Zendaya', 'Austin Butler'],
    correctAnswer: 1,
    explanation: 'Category: 2020s',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', '2020s', 'actors']
  },
  {
    id: 'movie_274',
    question: 'What year was "Top Gun: Maverick" released?',
    options: ['2020', '2022', '2024', '2026'],
    correctAnswer: 1,
    explanation: 'Category: 2020s',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', '2020s']
  },
  {
    id: 'movie_275',
    question: 'What year was "Oppenheimer" released?',
    options: ['2021', '2023', '2025', '2027'],
    correctAnswer: 1,
    explanation: 'Category: 2020s',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', '2020s']
  },
  {
    id: 'movie_276',
    question: 'What year was "Barbie" released?',
    options: ['2021', '2023', '2025', '2027'],
    correctAnswer: 1,
    explanation: 'Category: 2020s',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', '2020s']
  },
  {
    id: 'movie_277',
    question: 'Who directed "Barbie"?',
    options: ['Patty Jenkins', 'Greta Gerwig', 'Chloe Zhao', 'Olivia Wilde'],
    correctAnswer: 1,
    explanation: 'Category: 2020s',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', '2020s', 'directors']
  },
  {
    id: 'movie_278',
    question: 'Who plays Barbie in "Barbie"?',
    options: ['Emma Stone', 'Margot Robbie', 'Saoirse Ronan', 'Florence Pugh'],
    correctAnswer: 1,
    explanation: 'Category: 2020s',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', '2020s', 'actors']
  },
  {
    id: 'movie_279',
    question: 'Who plays Ken in "Barbie"?',
    options: ['Timothée Chalamet', 'Ryan Gosling', 'Austin Butler', 'Jacob Elordi'],
    correctAnswer: 1,
    explanation: 'Category: 2020s',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', '2020s', 'actors']
  },
  {
    id: 'movie_280',
    question: 'What year was "Everything Everywhere All at Once" released?',
    options: ['2020', '2022', '2024', '2026'],
    correctAnswer: 1,
    explanation: 'Category: 2020s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '2020s']
  },
  {
    id: 'movie_281',
    question: 'Who won Best Actress for "Everything Everywhere All at Once"?',
    options: ['Cate Blanchett', 'Michelle Yeoh', 'Ana de Armas', 'Andrea Riseborough'],
    correctAnswer: 1,
    explanation: 'Category: 2020s',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', '2020s', 'awards']
  },
  {
    id: 'movie_282',
    question: 'What year was "Spider-Man: No Way Home" released?',
    options: ['2019', '2021', '2023', '2025'],
    correctAnswer: 1,
    explanation: 'Category: 2020s',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', '2020s', 'mcu']
  },
  {
    id: 'movie_283',
    question: 'What year was "Avatar: The Way of Water" released?',
    options: ['2020', '2022', '2024', '2026'],
    correctAnswer: 1,
    explanation: 'Category: 2020s',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', '2020s']
  },
  {
    id: 'movie_284',
    question: 'What year was "The Batman" (Robert Pattinson) released?',
    options: ['2020', '2022', '2024', '2026'],
    correctAnswer: 1,
    explanation: 'Category: 2020s',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', '2020s']
  },
  {
    id: 'movie_285',
    question: 'Who plays Batman in "The Batman" (2022)?',
    options: ['Ben Affleck', 'Robert Pattinson', 'Christian Bale', 'George Clooney'],
    correctAnswer: 1,
    explanation: 'Category: 2020s',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', '2020s', 'actors']
  },

  // ============================================================================
  // MOVIE TRIVIA GENERAL (286-350)
  // ============================================================================
  {
    id: 'movie_286',
    question: 'What is the highest-grossing film of all time (unadjusted)?',
    options: ['Titanic', 'Avatar', 'Avengers: Endgame', 'Star Wars: The Force Awakens'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'casual',
    category: 'general',
    points: 1,
    tags: ['movies', 'general']
  },
  {
    id: 'movie_287',
    question: 'What film won the first Academy Award for Best Picture?',
    options: ['Sunrise', 'Wings', 'The Jazz Singer', 'All Quiet on the Western Front'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'expert',
    category: 'general',
    points: 3,
    tags: ['movies', 'general', 'awards']
  },
  {
    id: 'movie_288',
    question: 'What year were the first Academy Awards held?',
    options: ['1927', '1929', '1931', '1933'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'expert',
    category: 'general',
    points: 3,
    tags: ['movies', 'general', 'awards']
  },
  {
    id: 'movie_289',
    question: 'What is the longest film to win Best Picture?',
    options: ['Gone with the Wind', 'Lawrence of Arabia', 'The Godfather Part II', 'Ben-Hur'],
    correctAnswer: 0,
    explanation: 'Category: general',
    difficulty: 'expert',
    category: 'general',
    points: 3,
    tags: ['movies', 'general', 'awards']
  },
  {
    id: 'movie_290',
    question: 'What studio produced "Snow White and the Seven Dwarfs"?',
    options: ['Warner Bros', 'Disney', 'Universal', 'Paramount'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'casual',
    category: 'general',
    points: 1,
    tags: ['movies', 'general', 'animation']
  },
  {
    id: 'movie_291',
    question: 'What is the name of the fictional metal in "Black Panther"?',
    options: ['Adamantium', 'Vibranium', 'Unobtanium', 'Kryptonite'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'casual',
    category: 'general',
    points: 1,
    tags: ['movies', 'general', 'mcu']
  },
  {
    id: 'movie_292',
    question: 'What is the name of the fictional mineral in "Avatar"?',
    options: ['Vibranium', 'Unobtanium', 'Adamantium', 'Dilithium'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'moderate',
    category: 'general',
    points: 2,
    tags: ['movies', 'general', 'scifi']
  },
  {
    id: 'movie_293',
    question: 'What is the name of the ship in "Pirates of the Caribbean"?',
    options: ['The Flying Dutchman', 'The Black Pearl', 'The Queen Anne\'s Revenge', 'The Interceptor'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'casual',
    category: 'general',
    points: 1,
    tags: ['movies', 'general']
  },
  {
    id: 'movie_294',
    question: 'What is the name of the volleyball in "Cast Away"?',
    options: ['Wilson', 'Spalding', 'Chuck', 'Tom'],
    correctAnswer: 0,
    explanation: 'Category: general',
    difficulty: 'casual',
    category: 'general',
    points: 1,
    tags: ['movies', 'general']
  },
  {
    id: 'movie_295',
    question: 'What is the first rule of Fight Club?',
    options: ['Always fight fair', 'You do not talk about Fight Club', 'No weapons', 'One fight at a time'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'casual',
    category: 'general',
    points: 1,
    tags: ['movies', 'general', 'quotes']
  },

  {
    id: 'movie_296',
    question: 'What is the name of the computer in "2001: A Space Odyssey"?',
    options: ['JARVIS', 'HAL 9000', 'Skynet', 'WOPR'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'moderate',
    category: 'general',
    points: 2,
    tags: ['movies', 'general', 'scifi']
  },
  {
    id: 'movie_297',
    question: 'What is the name of the prison in "The Shawshank Redemption"?',
    options: ['Alcatraz', 'Shawshank State Penitentiary', 'San Quentin', 'Sing Sing'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'moderate',
    category: 'general',
    points: 2,
    tags: ['movies', 'general']
  },
  {
    id: 'movie_298',
    question: 'What is the name of the town in "Back to the Future"?',
    options: ['Springfield', 'Hill Valley', 'Riverdale', 'Twin Peaks'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'moderate',
    category: 'general',
    points: 2,
    tags: ['movies', 'general']
  },
  {
    id: 'movie_299',
    question: 'What is the name of the bar in "Star Wars"?',
    options: ['The Cantina', 'Mos Eisley Cantina', 'The Jedi Temple', 'Jabba\'s Palace'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'moderate',
    category: 'general',
    points: 2,
    tags: ['movies', 'general', 'scifi']
  },
  {
    id: 'movie_300',
    question: 'What is the name of the school in "Harry Potter"?',
    options: ['Beauxbatons', 'Durmstrang', 'Hogwarts', 'Ilvermorny'],
    correctAnswer: 2,
    explanation: 'Category: general',
    difficulty: 'casual',
    category: 'general',
    points: 1,
    tags: ['movies', 'general', 'fantasy']
  },

  // ============================================================================
  // DC MOVIES (301-350)
  // ============================================================================
  {
    id: 'movie_301',
    question: 'Who played Superman in "Man of Steel"?',
    options: ['Brandon Routh', 'Henry Cavill', 'Tom Welling', 'Christopher Reeve'],
    correctAnswer: 1,
    explanation: 'Category: dc',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'dc', 'actors']
  },
  {
    id: 'movie_302',
    question: 'Who directed "Man of Steel"?',
    options: ['Christopher Nolan', 'Zack Snyder', 'James Wan', 'Patty Jenkins'],
    correctAnswer: 1,
    explanation: 'Category: dc',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'dc', 'directors']
  },
  {
    id: 'movie_303',
    question: 'Who played Batman in "Batman v Superman"?',
    options: ['Christian Bale', 'Ben Affleck', 'Robert Pattinson', 'George Clooney'],
    correctAnswer: 1,
    explanation: 'Category: dc',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'dc', 'actors']
  },
  {
    id: 'movie_304',
    question: 'Who directed "Wonder Woman" (2017)?',
    options: ['Zack Snyder', 'Patty Jenkins', 'James Wan', 'David Ayer'],
    correctAnswer: 1,
    explanation: 'Category: dc',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'dc', 'directors']
  },
  {
    id: 'movie_305',
    question: 'Who directed "Aquaman"?',
    options: ['Zack Snyder', 'Patty Jenkins', 'James Wan', 'David F. Sandberg'],
    correctAnswer: 2,
    explanation: 'Category: dc',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'dc', 'directors']
  },
  {
    id: 'movie_306',
    question: 'Who plays Aquaman?',
    options: ['Chris Hemsworth', 'Jason Momoa', 'Dwayne Johnson', 'Henry Cavill'],
    correctAnswer: 1,
    explanation: 'Category: dc',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'dc', 'actors']
  },
  {
    id: 'movie_307',
    question: 'Who plays The Flash in the DCEU?',
    options: ['Grant Gustin', 'Ezra Miller', 'Wally West', 'Barry Allen'],
    correctAnswer: 1,
    explanation: 'Category: dc',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'dc', 'actors']
  },
  {
    id: 'movie_308',
    question: 'What year was "The Dark Knight" released?',
    options: ['2006', '2008', '2010', '2012'],
    correctAnswer: 1,
    explanation: 'Category: dc',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'dc']
  },
  {
    id: 'movie_309',
    question: 'What year was "The Dark Knight Rises" released?',
    options: ['2010', '2012', '2014', '2016'],
    correctAnswer: 1,
    explanation: 'Category: dc',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'dc']
  },
  {
    id: 'movie_310',
    question: 'Who played Bane in "The Dark Knight Rises"?',
    options: ['Tom Hardy', 'Christian Bale', 'Gary Oldman', 'Joseph Gordon-Levitt'],
    correctAnswer: 0,
    explanation: 'Category: dc',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'dc', 'actors']
  },
  {
    id: 'movie_311',
    question: 'Who played Catwoman in "The Dark Knight Rises"?',
    options: ['Michelle Pfeiffer', 'Anne Hathaway', 'Halle Berry', 'Zoë Kravitz'],
    correctAnswer: 1,
    explanation: 'Category: dc',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'dc', 'actors']
  },
  {
    id: 'movie_312',
    question: 'Who played Catwoman in "The Batman" (2022)?',
    options: ['Michelle Pfeiffer', 'Anne Hathaway', 'Halle Berry', 'Zoë Kravitz'],
    correctAnswer: 3,
    explanation: 'Category: dc',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'dc', 'actors']
  },
  {
    id: 'movie_313',
    question: 'Who played The Riddler in "The Batman" (2022)?',
    options: ['Jim Carrey', 'Paul Dano', 'Cory Michael Smith', 'Frank Gorshin'],
    correctAnswer: 1,
    explanation: 'Category: dc',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'dc', 'actors']
  },
  {
    id: 'movie_314',
    question: 'Who played The Penguin in "The Batman" (2022)?',
    options: ['Danny DeVito', 'Colin Farrell', 'Robin Lord Taylor', 'Burgess Meredith'],
    correctAnswer: 1,
    explanation: 'Category: dc',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'dc', 'actors']
  },
  {
    id: 'movie_315',
    question: 'What year was "Joker" released?',
    options: ['2017', '2019', '2021', '2023'],
    correctAnswer: 1,
    explanation: 'Category: dc',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'dc']
  },

  // ============================================================================
  // COMEDY MOVIES (316-365)
  // ============================================================================
  {
    id: 'movie_316',
    question: 'What year was "The Hangover" released?',
    options: ['2007', '2009', '2011', '2013'],
    correctAnswer: 1,
    explanation: 'Category: comedy',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'comedy']
  },
  {
    id: 'movie_317',
    question: 'What city is "The Hangover" set in?',
    options: ['Atlantic City', 'Las Vegas', 'Miami', 'Los Angeles'],
    correctAnswer: 1,
    explanation: 'Category: comedy',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'comedy']
  },
  {
    id: 'movie_318',
    question: 'What year was "Superbad" released?',
    options: ['2005', '2007', '2009', '2011'],
    correctAnswer: 1,
    explanation: 'Category: comedy',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'comedy']
  },
  {
    id: 'movie_319',
    question: 'Who directed "Superbad"?',
    options: ['Judd Apatow', 'Greg Mottola', 'Seth Rogen', 'Evan Goldberg'],
    correctAnswer: 1,
    explanation: 'Category: comedy',
    difficulty: 'expert',
    category: 'movies',
    points: 3,
    tags: ['movies', 'comedy', 'directors']
  },
  {
    id: 'movie_320',
    question: 'What year was "Bridesmaids" released?',
    options: ['2009', '2011', '2013', '2015'],
    correctAnswer: 1,
    explanation: 'Category: comedy',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'comedy']
  },

  {
    id: 'movie_321',
    question: 'Who stars in "Bridesmaids"?',
    options: ['Amy Schumer', 'Kristen Wiig', 'Tina Fey', 'Amy Poehler'],
    correctAnswer: 1,
    explanation: 'Category: comedy',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'comedy', 'actors']
  },
  {
    id: 'movie_322',
    question: 'What year was "Anchorman" released?',
    options: ['2002', '2004', '2006', '2008'],
    correctAnswer: 1,
    explanation: 'Category: comedy',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'comedy']
  },
  {
    id: 'movie_323',
    question: 'Who plays Ron Burgundy in "Anchorman"?',
    options: ['Steve Carell', 'Will Ferrell', 'Paul Rudd', 'David Koechner'],
    correctAnswer: 1,
    explanation: 'Category: comedy',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'comedy', 'actors']
  },
  {
    id: 'movie_324',
    question: 'What year was "Step Brothers" released?',
    options: ['2006', '2008', '2010', '2012'],
    correctAnswer: 1,
    explanation: 'Category: comedy',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'comedy']
  },
  {
    id: 'movie_325',
    question: 'Who stars in "Step Brothers" with Will Ferrell?',
    options: ['Adam McKay', 'John C. Reilly', 'Mark Wahlberg', 'Steve Carell'],
    correctAnswer: 1,
    explanation: 'Category: comedy',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'comedy', 'actors']
  },
  {
    id: 'movie_326',
    question: 'What year was "The 40-Year-Old Virgin" released?',
    options: ['2003', '2005', '2007', '2009'],
    correctAnswer: 1,
    explanation: 'Category: comedy',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'comedy']
  },
  {
    id: 'movie_327',
    question: 'Who stars in "The 40-Year-Old Virgin"?',
    options: ['Will Ferrell', 'Steve Carell', 'Seth Rogen', 'Paul Rudd'],
    correctAnswer: 1,
    explanation: 'Category: comedy',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'comedy', 'actors']
  },
  {
    id: 'movie_328',
    question: 'What year was "Knocked Up" released?',
    options: ['2005', '2007', '2009', '2011'],
    correctAnswer: 1,
    explanation: 'Category: comedy',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'comedy']
  },
  {
    id: 'movie_329',
    question: 'Who directed "Knocked Up"?',
    options: ['Seth Rogen', 'Judd Apatow', 'Adam McKay', 'Greg Mottola'],
    correctAnswer: 1,
    explanation: 'Category: comedy',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'comedy', 'directors']
  },
  {
    id: 'movie_330',
    question: 'What year was "Dumb and Dumber" released?',
    options: ['1992', '1994', '1996', '1998'],
    correctAnswer: 1,
    explanation: 'Category: comedy',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'comedy']
  },
  {
    id: 'movie_331',
    question: 'Who stars in "Dumb and Dumber"?',
    options: ['Adam Sandler & Chris Farley', 'Jim Carrey & Jeff Daniels', 'Ben Stiller & Owen Wilson', 'Will Ferrell & John C. Reilly'],
    correctAnswer: 1,
    explanation: 'Category: comedy',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'comedy', 'actors']
  },
  {
    id: 'movie_332',
    question: 'What year was "Ace Ventura: Pet Detective" released?',
    options: ['1992', '1994', '1996', '1998'],
    correctAnswer: 1,
    explanation: 'Category: comedy',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'comedy']
  },
  {
    id: 'movie_333',
    question: 'Who plays Ace Ventura?',
    options: ['Adam Sandler', 'Jim Carrey', 'Chris Farley', 'Mike Myers'],
    correctAnswer: 1,
    explanation: 'Category: comedy',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'comedy', 'actors']
  },
  {
    id: 'movie_334',
    question: 'What year was "The Mask" released?',
    options: ['1992', '1994', '1996', '1998'],
    correctAnswer: 1,
    explanation: 'Category: comedy',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'comedy']
  },
  {
    id: 'movie_335',
    question: 'Who plays Stanley Ipkiss in "The Mask"?',
    options: ['Adam Sandler', 'Jim Carrey', 'Chris Farley', 'Mike Myers'],
    correctAnswer: 1,
    explanation: 'Category: comedy',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'comedy', 'actors']
  },

  // ============================================================================
  // ACTION MOVIES (336-385)
  // ============================================================================
  {
    id: 'movie_336',
    question: 'What year was "Die Hard" released?',
    options: ['1986', '1988', '1990', '1992'],
    correctAnswer: 1,
    explanation: 'Category: action',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'action']
  },
  {
    id: 'movie_337',
    question: 'Who plays John McClane in "Die Hard"?',
    options: ['Arnold Schwarzenegger', 'Bruce Willis', 'Sylvester Stallone', 'Mel Gibson'],
    correctAnswer: 1,
    explanation: 'Category: action',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'action', 'actors']
  },
  {
    id: 'movie_338',
    question: 'What building is "Die Hard" set in?',
    options: ['Empire State Building', 'Nakatomi Plaza', 'Willis Tower', 'World Trade Center'],
    correctAnswer: 1,
    explanation: 'Category: action',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'action']
  },
  {
    id: 'movie_339',
    question: 'What year was "Lethal Weapon" released?',
    options: ['1985', '1987', '1989', '1991'],
    correctAnswer: 1,
    explanation: 'Category: action',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'action']
  },
  {
    id: 'movie_340',
    question: 'Who stars in "Lethal Weapon"?',
    options: ['Bruce Willis & Samuel L. Jackson', 'Mel Gibson & Danny Glover', 'Eddie Murphy & Nick Nolte', 'Arnold & Stallone'],
    correctAnswer: 1,
    explanation: 'Category: action',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'action', 'actors']
  },
  {
    id: 'movie_341',
    question: 'What year was "Predator" released?',
    options: ['1985', '1987', '1989', '1991'],
    correctAnswer: 1,
    explanation: 'Category: action',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'action']
  },
  {
    id: 'movie_342',
    question: 'Who stars in "Predator"?',
    options: ['Sylvester Stallone', 'Arnold Schwarzenegger', 'Bruce Willis', 'Jean-Claude Van Damme'],
    correctAnswer: 1,
    explanation: 'Category: action',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'action', 'actors']
  },
  {
    id: 'movie_343',
    question: 'What year was "Total Recall" (original) released?',
    options: ['1988', '1990', '1992', '1994'],
    correctAnswer: 1,
    explanation: 'Category: action',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'action']
  },
  {
    id: 'movie_344',
    question: 'What year was "RoboCop" released?',
    options: ['1985', '1987', '1989', '1991'],
    correctAnswer: 1,
    explanation: 'Category: action',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'action']
  },
  {
    id: 'movie_345',
    question: 'Who directed "RoboCop"?',
    options: ['James Cameron', 'Paul Verhoeven', 'John McTiernan', 'Ridley Scott'],
    correctAnswer: 1,
    explanation: 'Category: action',
    difficulty: 'expert',
    category: 'movies',
    points: 3,
    tags: ['movies', 'action', 'directors']
  },

  {
    id: 'movie_346',
    question: 'What year was the first "John Wick" released?',
    options: ['2012', '2014', '2016', '2018'],
    correctAnswer: 1,
    explanation: 'Category: action',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'action']
  },
  {
    id: 'movie_347',
    question: 'How many "John Wick" films are there (as of 2023)?',
    options: ['3', '4', '5', '6'],
    correctAnswer: 1,
    explanation: 'Category: action',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'action']
  },
  {
    id: 'movie_348',
    question: 'What year was "Mad Max" (original) released?',
    options: ['1977', '1979', '1981', '1983'],
    correctAnswer: 1,
    explanation: 'Category: action',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'action']
  },
  {
    id: 'movie_349',
    question: 'Who played Mad Max in the original films?',
    options: ['Tom Hardy', 'Mel Gibson', 'Russell Crowe', 'Hugh Jackman'],
    correctAnswer: 1,
    explanation: 'Category: action',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'action', 'actors']
  },
  {
    id: 'movie_350',
    question: 'Who played Mad Max in "Fury Road"?',
    options: ['Mel Gibson', 'Tom Hardy', 'Russell Crowe', 'Hugh Jackman'],
    correctAnswer: 1,
    explanation: 'Category: action',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'action', 'actors']
  },

  // ============================================================================
  // ROMANCE & DRAMA (351-400)
  // ============================================================================
  {
    id: 'movie_351',
    question: 'What year was "The Notebook" released?',
    options: ['2002', '2004', '2006', '2008'],
    correctAnswer: 1,
    explanation: 'Category: romance',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'romance']
  },
  {
    id: 'movie_352',
    question: 'Who stars in "The Notebook"?',
    options: ['Leonardo DiCaprio & Kate Winslet', 'Ryan Gosling & Rachel McAdams', 'Brad Pitt & Angelina Jolie', 'George Clooney & Julia Roberts'],
    correctAnswer: 1,
    explanation: 'Category: romance',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'romance', 'actors']
  },
  {
    id: 'movie_353',
    question: 'What year was "Pretty Woman" released?',
    options: ['1988', '1990', '1992', '1994'],
    correctAnswer: 1,
    explanation: 'Category: romance',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'romance']
  },
  {
    id: 'movie_354',
    question: 'Who stars in "Pretty Woman"?',
    options: ['Tom Hanks & Meg Ryan', 'Richard Gere & Julia Roberts', 'Hugh Grant & Julia Roberts', 'George Clooney & Julia Roberts'],
    correctAnswer: 1,
    explanation: 'Category: romance',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'romance', 'actors']
  },
  {
    id: 'movie_355',
    question: 'What year was "Notting Hill" released?',
    options: ['1997', '1999', '2001', '2003'],
    correctAnswer: 1,
    explanation: 'Category: romance',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'romance']
  },
  {
    id: 'movie_356',
    question: 'Who stars in "Notting Hill"?',
    options: ['Tom Hanks & Meg Ryan', 'Richard Gere & Julia Roberts', 'Hugh Grant & Julia Roberts', 'George Clooney & Julia Roberts'],
    correctAnswer: 2,
    explanation: 'Category: romance',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'romance', 'actors']
  },
  {
    id: 'movie_357',
    question: 'What year was "Sleepless in Seattle" released?',
    options: ['1991', '1993', '1995', '1997'],
    correctAnswer: 1,
    explanation: 'Category: romance',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'romance']
  },
  {
    id: 'movie_358',
    question: 'Who stars in "Sleepless in Seattle"?',
    options: ['Tom Hanks & Meg Ryan', 'Richard Gere & Julia Roberts', 'Hugh Grant & Julia Roberts', 'Billy Crystal & Meg Ryan'],
    correctAnswer: 0,
    explanation: 'Category: romance',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'romance', 'actors']
  },
  {
    id: 'movie_359',
    question: 'What year was "You\'ve Got Mail" released?',
    options: ['1996', '1998', '2000', '2002'],
    correctAnswer: 1,
    explanation: 'Category: romance',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'romance']
  },
  {
    id: 'movie_360',
    question: 'Who stars in "You\'ve Got Mail"?',
    options: ['Tom Hanks & Meg Ryan', 'Richard Gere & Julia Roberts', 'Hugh Grant & Julia Roberts', 'Billy Crystal & Meg Ryan'],
    correctAnswer: 0,
    explanation: 'Category: romance',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'romance', 'actors']
  },
  {
    id: 'movie_361',
    question: 'What year was "When Harry Met Sally" released?',
    options: ['1987', '1989', '1991', '1993'],
    correctAnswer: 1,
    explanation: 'Category: romance',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'romance']
  },
  {
    id: 'movie_362',
    question: 'Who stars in "When Harry Met Sally"?',
    options: ['Tom Hanks & Meg Ryan', 'Richard Gere & Julia Roberts', 'Hugh Grant & Julia Roberts', 'Billy Crystal & Meg Ryan'],
    correctAnswer: 3,
    explanation: 'Category: romance',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'romance', 'actors']
  },
  {
    id: 'movie_363',
    question: 'What year was "A Star Is Born" (2018) released?',
    options: ['2016', '2018', '2020', '2022'],
    correctAnswer: 1,
    explanation: 'Category: romance',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'romance']
  },
  {
    id: 'movie_364',
    question: 'Who stars in "A Star Is Born" (2018)?',
    options: ['Ryan Gosling & Emma Stone', 'Bradley Cooper & Lady Gaga', 'Chris Pratt & Jennifer Lawrence', 'Jake Gyllenhaal & Anne Hathaway'],
    correctAnswer: 1,
    explanation: 'Category: romance',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'romance', 'actors']
  },
  {
    id: 'movie_365',
    question: 'Who directed "A Star Is Born" (2018)?',
    options: ['Damien Chazelle', 'Bradley Cooper', 'Clint Eastwood', 'David O. Russell'],
    correctAnswer: 1,
    explanation: 'Category: romance',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'romance', 'directors']
  },

  // ============================================================================
  // MUSICALS (366-400)
  // ============================================================================
  {
    id: 'movie_366',
    question: 'What year was "La La Land" released?',
    options: ['2014', '2016', '2018', '2020'],
    correctAnswer: 1,
    explanation: 'Category: musical',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'musical']
  },
  {
    id: 'movie_367',
    question: 'Who directed "La La Land"?',
    options: ['Baz Luhrmann', 'Damien Chazelle', 'Tom Hooper', 'Rob Marshall'],
    correctAnswer: 1,
    explanation: 'Category: musical',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'musical', 'directors']
  },
  {
    id: 'movie_368',
    question: 'Who stars in "La La Land"?',
    options: ['Bradley Cooper & Lady Gaga', 'Ryan Gosling & Emma Stone', 'Hugh Jackman & Anne Hathaway', 'Zac Efron & Zendaya'],
    correctAnswer: 1,
    explanation: 'Category: musical',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'musical', 'actors']
  },
  {
    id: 'movie_369',
    question: 'What year was "The Greatest Showman" released?',
    options: ['2015', '2017', '2019', '2021'],
    correctAnswer: 1,
    explanation: 'Category: musical',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'musical']
  },
  {
    id: 'movie_370',
    question: 'Who plays P.T. Barnum in "The Greatest Showman"?',
    options: ['Ryan Gosling', 'Hugh Jackman', 'Zac Efron', 'Bradley Cooper'],
    correctAnswer: 1,
    explanation: 'Category: musical',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'musical', 'actors']
  },

  {
    id: 'movie_371',
    question: 'What year was "Les Misérables" (2012) released?',
    options: ['2010', '2012', '2014', '2016'],
    correctAnswer: 1,
    explanation: 'Category: musical',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'musical']
  },
  {
    id: 'movie_372',
    question: 'Who plays Jean Valjean in "Les Misérables" (2012)?',
    options: ['Russell Crowe', 'Hugh Jackman', 'Eddie Redmayne', 'Sacha Baron Cohen'],
    correctAnswer: 1,
    explanation: 'Category: musical',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'musical', 'actors']
  },
  {
    id: 'movie_373',
    question: 'What year was "Grease" released?',
    options: ['1976', '1978', '1980', '1982'],
    correctAnswer: 1,
    explanation: 'Category: musical',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'musical']
  },
  {
    id: 'movie_374',
    question: 'Who stars in "Grease"?',
    options: ['Elvis Presley & Ann-Margret', 'John Travolta & Olivia Newton-John', 'Patrick Swayze & Jennifer Grey', 'Kevin Bacon & Lori Singer'],
    correctAnswer: 1,
    explanation: 'Category: musical',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'musical', 'actors']
  },
  {
    id: 'movie_375',
    question: 'What year was "Moulin Rouge!" released?',
    options: ['1999', '2001', '2003', '2005'],
    correctAnswer: 1,
    explanation: 'Category: musical',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'musical']
  },
  {
    id: 'movie_376',
    question: 'Who directed "Moulin Rouge!"?',
    options: ['Tim Burton', 'Baz Luhrmann', 'Rob Marshall', 'Tom Hooper'],
    correctAnswer: 1,
    explanation: 'Category: musical',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'musical', 'directors']
  },
  {
    id: 'movie_377',
    question: 'Who stars in "Moulin Rouge!"?',
    options: ['Leonardo DiCaprio & Kate Winslet', 'Ewan McGregor & Nicole Kidman', 'Hugh Jackman & Anne Hathaway', 'Ryan Gosling & Emma Stone'],
    correctAnswer: 1,
    explanation: 'Category: musical',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'musical', 'actors']
  },
  {
    id: 'movie_378',
    question: 'What year was "Chicago" released?',
    options: ['2000', '2002', '2004', '2006'],
    correctAnswer: 1,
    explanation: 'Category: musical',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'musical']
  },
  {
    id: 'movie_379',
    question: 'Who stars in "Chicago"?',
    options: ['Nicole Kidman & Ewan McGregor', 'Renée Zellweger & Catherine Zeta-Jones', 'Anne Hathaway & Hugh Jackman', 'Emma Stone & Ryan Gosling'],
    correctAnswer: 1,
    explanation: 'Category: musical',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'musical', 'actors']
  },
  {
    id: 'movie_380',
    question: 'What year was "Mamma Mia!" released?',
    options: ['2006', '2008', '2010', '2012'],
    correctAnswer: 1,
    explanation: 'Category: musical',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'musical']
  },

  // ============================================================================
  // THRILLER & MYSTERY (381-430)
  // ============================================================================
  {
    id: 'movie_381',
    question: 'What year was "Gone Girl" released?',
    options: ['2012', '2014', '2016', '2018'],
    correctAnswer: 1,
    explanation: 'Category: thriller',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'thriller']
  },
  {
    id: 'movie_382',
    question: 'Who directed "Gone Girl"?',
    options: ['Christopher Nolan', 'David Fincher', 'Denis Villeneuve', 'Darren Aronofsky'],
    correctAnswer: 1,
    explanation: 'Category: thriller',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'thriller', 'directors']
  },
  {
    id: 'movie_383',
    question: 'Who stars in "Gone Girl"?',
    options: ['Leonardo DiCaprio & Kate Winslet', 'Ben Affleck & Rosamund Pike', 'Brad Pitt & Angelina Jolie', 'Matt Damon & Emily Blunt'],
    correctAnswer: 1,
    explanation: 'Category: thriller',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'thriller', 'actors']
  },
  {
    id: 'movie_384',
    question: 'What year was "Zodiac" released?',
    options: ['2005', '2007', '2009', '2011'],
    correctAnswer: 1,
    explanation: 'Category: thriller',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'thriller']
  },
  {
    id: 'movie_385',
    question: 'Who directed "Zodiac"?',
    options: ['Christopher Nolan', 'David Fincher', 'Denis Villeneuve', 'Darren Aronofsky'],
    correctAnswer: 1,
    explanation: 'Category: thriller',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'thriller', 'directors']
  },
  {
    id: 'movie_386',
    question: 'What year was "Prisoners" released?',
    options: ['2011', '2013', '2015', '2017'],
    correctAnswer: 1,
    explanation: 'Category: thriller',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'thriller']
  },
  {
    id: 'movie_387',
    question: 'Who directed "Prisoners"?',
    options: ['Christopher Nolan', 'David Fincher', 'Denis Villeneuve', 'Darren Aronofsky'],
    correctAnswer: 2,
    explanation: 'Category: thriller',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'thriller', 'directors']
  },
  {
    id: 'movie_388',
    question: 'Who stars in "Prisoners"?',
    options: ['Leonardo DiCaprio & Mark Ruffalo', 'Hugh Jackman & Jake Gyllenhaal', 'Brad Pitt & Morgan Freeman', 'Matt Damon & Ben Affleck'],
    correctAnswer: 1,
    explanation: 'Category: thriller',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'thriller', 'actors']
  },
  {
    id: 'movie_389',
    question: 'What year was "Shutter Island" released?',
    options: ['2008', '2010', '2012', '2014'],
    correctAnswer: 1,
    explanation: 'Category: thriller',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'thriller']
  },
  {
    id: 'movie_390',
    question: 'Who directed "Shutter Island"?',
    options: ['Christopher Nolan', 'Martin Scorsese', 'David Fincher', 'Denis Villeneuve'],
    correctAnswer: 1,
    explanation: 'Category: thriller',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'thriller', 'directors']
  },
  {
    id: 'movie_391',
    question: 'Who stars in "Shutter Island"?',
    options: ['Brad Pitt', 'Leonardo DiCaprio', 'Matt Damon', 'George Clooney'],
    correctAnswer: 1,
    explanation: 'Category: thriller',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'thriller', 'actors']
  },
  {
    id: 'movie_392',
    question: 'What year was "The Girl with the Dragon Tattoo" (US) released?',
    options: ['2009', '2011', '2013', '2015'],
    correctAnswer: 1,
    explanation: 'Category: thriller',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'thriller']
  },
  {
    id: 'movie_393',
    question: 'Who directed "The Girl with the Dragon Tattoo" (US)?',
    options: ['Christopher Nolan', 'David Fincher', 'Denis Villeneuve', 'Ridley Scott'],
    correctAnswer: 1,
    explanation: 'Category: thriller',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'thriller', 'directors']
  },
  {
    id: 'movie_394',
    question: 'Who plays Lisbeth Salander in the US version?',
    options: ['Noomi Rapace', 'Rooney Mara', 'Claire Foy', 'Scarlett Johansson'],
    correctAnswer: 1,
    explanation: 'Category: thriller',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'thriller', 'actors']
  },
  {
    id: 'movie_395',
    question: 'What year was "Knives Out" released?',
    options: ['2017', '2019', '2021', '2023'],
    correctAnswer: 1,
    explanation: 'Category: thriller',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'thriller']
  },

  {
    id: 'movie_396',
    question: 'Who directed "Knives Out"?',
    options: ['Christopher Nolan', 'Rian Johnson', 'David Fincher', 'Edgar Wright'],
    correctAnswer: 1,
    explanation: 'Category: thriller',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'thriller', 'directors']
  },
  {
    id: 'movie_397',
    question: 'Who plays the detective in "Knives Out"?',
    options: ['Chris Evans', 'Daniel Craig', 'Jamie Lee Curtis', 'Michael Shannon'],
    correctAnswer: 1,
    explanation: 'Category: thriller',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'thriller', 'actors']
  },
  {
    id: 'movie_398',
    question: 'What year was "Glass Onion" released?',
    options: ['2020', '2022', '2023', '2024'],
    correctAnswer: 1,
    explanation: 'Category: thriller',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'thriller']
  },
  {
    id: 'movie_399',
    question: 'What year was "The Prestige" released?',
    options: ['2004', '2006', '2008', '2010'],
    correctAnswer: 1,
    explanation: 'Category: thriller',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'thriller']
  },
  {
    id: 'movie_400',
    question: 'Who directed "The Prestige"?',
    options: ['David Fincher', 'Christopher Nolan', 'Denis Villeneuve', 'Ridley Scott'],
    correctAnswer: 1,
    explanation: 'Category: thriller',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'thriller', 'directors']
  },

  // ============================================================================
  // STUDIO GHIBLI & ANIME FILMS (401-430)
  // ============================================================================
  {
    id: 'movie_401',
    question: 'Who founded Studio Ghibli?',
    options: ['Makoto Shinkai', 'Hayao Miyazaki', 'Satoshi Kon', 'Mamoru Hosoda'],
    correctAnswer: 1,
    explanation: 'Category: anime',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'anime', 'animation']
  },
  {
    id: 'movie_402',
    question: 'What year was "Spirited Away" released?',
    options: ['1999', '2001', '2003', '2005'],
    correctAnswer: 1,
    explanation: 'Category: anime',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'anime', 'animation']
  },
  {
    id: 'movie_403',
    question: 'What is the name of the main character in "Spirited Away"?',
    options: ['Kiki', 'Chihiro', 'Sophie', 'San'],
    correctAnswer: 1,
    explanation: 'Category: anime',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'anime', 'animation']
  },
  {
    id: 'movie_404',
    question: 'What year was "My Neighbor Totoro" released?',
    options: ['1986', '1988', '1990', '1992'],
    correctAnswer: 1,
    explanation: 'Category: anime',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'anime', 'animation']
  },
  {
    id: 'movie_405',
    question: 'What year was "Princess Mononoke" released?',
    options: ['1995', '1997', '1999', '2001'],
    correctAnswer: 1,
    explanation: 'Category: anime',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'anime', 'animation']
  },
  {
    id: 'movie_406',
    question: 'Who directed "Your Name"?',
    options: ['Hayao Miyazaki', 'Makoto Shinkai', 'Mamoru Hosoda', 'Satoshi Kon'],
    correctAnswer: 1,
    explanation: 'Category: anime',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'anime', 'directors']
  },
  {
    id: 'movie_407',
    question: 'What year was "Your Name" released?',
    options: ['2014', '2016', '2018', '2020'],
    correctAnswer: 1,
    explanation: 'Category: anime',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'anime', 'animation']
  },
  {
    id: 'movie_408',
    question: 'What year was "Akira" released?',
    options: ['1986', '1988', '1990', '1992'],
    correctAnswer: 1,
    explanation: 'Category: anime',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'anime', 'animation']
  },
  {
    id: 'movie_409',
    question: 'What city is "Akira" set in?',
    options: ['Tokyo', 'Neo Tokyo', 'Osaka', 'Kyoto'],
    correctAnswer: 1,
    explanation: 'Category: anime',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'anime']
  },
  {
    id: 'movie_410',
    question: 'What year was "Howl\'s Moving Castle" released?',
    options: ['2002', '2004', '2006', '2008'],
    correctAnswer: 1,
    explanation: 'Category: anime',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'anime', 'animation']
  },

  // ============================================================================
  // BIOGRAPHICAL FILMS (411-450)
  // ============================================================================
  {
    id: 'movie_411',
    question: 'Who played Mark Zuckerberg in "The Social Network"?',
    options: ['Andrew Garfield', 'Jesse Eisenberg', 'Justin Timberlake', 'Armie Hammer'],
    correctAnswer: 1,
    explanation: 'Category: biopic',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'biopic', 'actors']
  },
  {
    id: 'movie_412',
    question: 'Who played Steve Jobs in "Steve Jobs" (2015)?',
    options: ['Ashton Kutcher', 'Michael Fassbender', 'Christian Bale', 'Leonardo DiCaprio'],
    correctAnswer: 1,
    explanation: 'Category: biopic',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'biopic', 'actors']
  },
  {
    id: 'movie_413',
    question: 'Who played Freddie Mercury in "Bohemian Rhapsody"?',
    options: ['Ben Whishaw', 'Rami Malek', 'Sacha Baron Cohen', 'Eddie Redmayne'],
    correctAnswer: 1,
    explanation: 'Category: biopic',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'biopic', 'actors']
  },
  {
    id: 'movie_414',
    question: 'What year was "Bohemian Rhapsody" released?',
    options: ['2016', '2018', '2020', '2022'],
    correctAnswer: 1,
    explanation: 'Category: biopic',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'biopic']
  },
  {
    id: 'movie_415',
    question: 'Who played Elton John in "Rocketman"?',
    options: ['Rami Malek', 'Taron Egerton', 'Eddie Redmayne', 'Tom Hardy'],
    correctAnswer: 1,
    explanation: 'Category: biopic',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'biopic', 'actors']
  },
  {
    id: 'movie_416',
    question: 'Who played Ray Charles in "Ray"?',
    options: ['Denzel Washington', 'Jamie Foxx', 'Will Smith', 'Forest Whitaker'],
    correctAnswer: 1,
    explanation: 'Category: biopic',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'biopic', 'actors']
  },
  {
    id: 'movie_417',
    question: 'Who played Muhammad Ali in "Ali"?',
    options: ['Denzel Washington', 'Jamie Foxx', 'Will Smith', 'Michael B. Jordan'],
    correctAnswer: 2,
    explanation: 'Category: biopic',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'biopic', 'actors']
  },
  {
    id: 'movie_418',
    question: 'Who played J. Robert Oppenheimer in "Oppenheimer"?',
    options: ['Robert Downey Jr.', 'Cillian Murphy', 'Matt Damon', 'Josh Hartnett'],
    correctAnswer: 1,
    explanation: 'Category: biopic',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'biopic', 'actors']
  },
  {
    id: 'movie_419',
    question: 'Who played Elvis in "Elvis" (2022)?',
    options: ['Timothée Chalamet', 'Austin Butler', 'Tom Holland', 'Ansel Elgort'],
    correctAnswer: 1,
    explanation: 'Category: biopic',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'biopic', 'actors']
  },
  {
    id: 'movie_420',
    question: 'Who directed "Elvis" (2022)?',
    options: ['Damien Chazelle', 'Baz Luhrmann', 'Tom Hooper', 'Bradley Cooper'],
    correctAnswer: 1,
    explanation: 'Category: biopic',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'biopic', 'directors']
  },


  // ============================================================================
  // WAR FILMS (421-450)
  // ============================================================================
  {
    id: 'movie_421',
    question: 'What year was "Saving Private Ryan" released?',
    options: ['1996', '1998', '2000', '2002'],
    correctAnswer: 1,
    explanation: 'Category: war',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'war']
  },
  {
    id: 'movie_422',
    question: 'Who directed "Saving Private Ryan"?',
    options: ['Ridley Scott', 'Steven Spielberg', 'Oliver Stone', 'Clint Eastwood'],
    correctAnswer: 1,
    explanation: 'Category: war',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'war', 'directors']
  },
  {
    id: 'movie_423',
    question: 'Who plays Captain Miller in "Saving Private Ryan"?',
    options: ['Matt Damon', 'Tom Hanks', 'Tom Sizemore', 'Edward Burns'],
    correctAnswer: 1,
    explanation: 'Category: war',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'war', 'actors']
  },
  {
    id: 'movie_424',
    question: 'What year was "Dunkirk" released?',
    options: ['2015', '2017', '2019', '2021'],
    correctAnswer: 1,
    explanation: 'Category: war',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'war']
  },
  {
    id: 'movie_425',
    question: 'What year was "1917" released?',
    options: ['2017', '2019', '2021', '2023'],
    correctAnswer: 1,
    explanation: 'Category: war',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'war']
  },
  {
    id: 'movie_426',
    question: 'Who directed "1917"?',
    options: ['Christopher Nolan', 'Sam Mendes', 'Steven Spielberg', 'Ridley Scott'],
    correctAnswer: 1,
    explanation: 'Category: war',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'war', 'directors']
  },
  {
    id: 'movie_427',
    question: 'What year was "Apocalypse Now" released?',
    options: ['1977', '1979', '1981', '1983'],
    correctAnswer: 1,
    explanation: 'Category: war',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'war']
  },
  {
    id: 'movie_428',
    question: 'Who directed "Apocalypse Now"?',
    options: ['Stanley Kubrick', 'Francis Ford Coppola', 'Oliver Stone', 'Martin Scorsese'],
    correctAnswer: 1,
    explanation: 'Category: war',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'war', 'directors']
  },
  {
    id: 'movie_429',
    question: 'What year was "Full Metal Jacket" released?',
    options: ['1985', '1987', '1989', '1991'],
    correctAnswer: 1,
    explanation: 'Category: war',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'war']
  },
  {
    id: 'movie_430',
    question: 'Who directed "Full Metal Jacket"?',
    options: ['Francis Ford Coppola', 'Stanley Kubrick', 'Oliver Stone', 'Brian De Palma'],
    correctAnswer: 1,
    explanation: 'Category: war',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'war', 'directors']
  },

  // ============================================================================
  // SPORTS FILMS (431-460)
  // ============================================================================
  {
    id: 'movie_431',
    question: 'What year was "Rocky" released?',
    options: ['1974', '1976', '1978', '1980'],
    correctAnswer: 1,
    explanation: 'Category: sports',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'sports']
  },
  {
    id: 'movie_432',
    question: 'Who plays Rocky Balboa?',
    options: ['Arnold Schwarzenegger', 'Sylvester Stallone', 'Carl Weathers', 'Dolph Lundgren'],
    correctAnswer: 1,
    explanation: 'Category: sports',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'sports', 'actors']
  },
  {
    id: 'movie_433',
    question: 'What year was "Creed" released?',
    options: ['2013', '2015', '2017', '2019'],
    correctAnswer: 1,
    explanation: 'Category: sports',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'sports']
  },
  {
    id: 'movie_434',
    question: 'Who plays Adonis Creed?',
    options: ['Chadwick Boseman', 'Michael B. Jordan', 'John Boyega', 'Lakeith Stanfield'],
    correctAnswer: 1,
    explanation: 'Category: sports',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'sports', 'actors']
  },
  {
    id: 'movie_435',
    question: 'What year was "Remember the Titans" released?',
    options: ['1998', '2000', '2002', '2004'],
    correctAnswer: 1,
    explanation: 'Category: sports',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'sports']
  },
  {
    id: 'movie_436',
    question: 'Who stars in "Remember the Titans"?',
    options: ['Will Smith', 'Denzel Washington', 'Jamie Foxx', 'Morgan Freeman'],
    correctAnswer: 1,
    explanation: 'Category: sports',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'sports', 'actors']
  },
  {
    id: 'movie_437',
    question: 'What year was "The Blind Side" released?',
    options: ['2007', '2009', '2011', '2013'],
    correctAnswer: 1,
    explanation: 'Category: sports',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'sports']
  },
  {
    id: 'movie_438',
    question: 'Who won Best Actress for "The Blind Side"?',
    options: ['Meryl Streep', 'Sandra Bullock', 'Julia Roberts', 'Reese Witherspoon'],
    correctAnswer: 1,
    explanation: 'Category: sports',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'sports', 'awards']
  },
  {
    id: 'movie_439',
    question: 'What year was "Moneyball" released?',
    options: ['2009', '2011', '2013', '2015'],
    correctAnswer: 1,
    explanation: 'Category: sports',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'sports']
  },
  {
    id: 'movie_440',
    question: 'Who stars in "Moneyball"?',
    options: ['Matt Damon', 'Brad Pitt', 'George Clooney', 'Leonardo DiCaprio'],
    correctAnswer: 1,
    explanation: 'Category: sports',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'sports', 'actors']
  },

  // ============================================================================
  // CRIME & GANGSTER (441-480)
  // ============================================================================
  {
    id: 'movie_441',
    question: 'What year was "The Godfather Part II" released?',
    options: ['1972', '1974', '1976', '1978'],
    correctAnswer: 1,
    explanation: 'Category: crime',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'crime']
  },
  {
    id: 'movie_442',
    question: 'Who plays young Vito Corleone in "The Godfather Part II"?',
    options: ['Al Pacino', 'Robert De Niro', 'James Caan', 'John Cazale'],
    correctAnswer: 1,
    explanation: 'Category: crime',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'crime', 'actors']
  },
  {
    id: 'movie_443',
    question: 'What year was "Scarface" released?',
    options: ['1981', '1983', '1985', '1987'],
    correctAnswer: 1,
    explanation: 'Category: crime',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'crime']
  },
  {
    id: 'movie_444',
    question: 'Who plays Tony Montana in "Scarface"?',
    options: ['Robert De Niro', 'Al Pacino', 'Joe Pesci', 'Ray Liotta'],
    correctAnswer: 1,
    explanation: 'Category: crime',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'crime', 'actors']
  },
  {
    id: 'movie_445',
    question: 'Who directed "Scarface" (1983)?',
    options: ['Martin Scorsese', 'Brian De Palma', 'Francis Ford Coppola', 'Oliver Stone'],
    correctAnswer: 1,
    explanation: 'Category: crime',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'crime', 'directors']
  },
  {
    id: 'movie_446',
    question: 'What year was "Casino" released?',
    options: ['1993', '1995', '1997', '1999'],
    correctAnswer: 1,
    explanation: 'Category: crime',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'crime']
  },
  {
    id: 'movie_447',
    question: 'Who directed "Casino"?',
    options: ['Brian De Palma', 'Martin Scorsese', 'Francis Ford Coppola', 'Quentin Tarantino'],
    correctAnswer: 1,
    explanation: 'Category: crime',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'crime', 'directors']
  },
  {
    id: 'movie_448',
    question: 'What year was "Heat" released?',
    options: ['1993', '1995', '1997', '1999'],
    correctAnswer: 1,
    explanation: 'Category: crime',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'crime']
  },
  {
    id: 'movie_449',
    question: 'Who directed "Heat"?',
    options: ['Martin Scorsese', 'Michael Mann', 'Brian De Palma', 'Ridley Scott'],
    correctAnswer: 1,
    explanation: 'Category: crime',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'crime', 'directors']
  },
  {
    id: 'movie_450',
    question: 'Who stars in "Heat"?',
    options: ['Tom Hanks & Leonardo DiCaprio', 'Al Pacino & Robert De Niro', 'Brad Pitt & George Clooney', 'Matt Damon & Ben Affleck'],
    correctAnswer: 1,
    explanation: 'Category: crime',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'crime', 'actors']
  },


  // ============================================================================
  // WESTERN FILMS (451-470)
  // ============================================================================
  {
    id: 'movie_451',
    question: 'Who directed "The Good, the Bad and the Ugly"?',
    options: ['John Ford', 'Sergio Leone', 'Clint Eastwood', 'Sam Peckinpah'],
    correctAnswer: 1,
    explanation: 'Category: western',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'western', 'directors']
  },
  {
    id: 'movie_452',
    question: 'What year was "The Good, the Bad and the Ugly" released?',
    options: ['1964', '1966', '1968', '1970'],
    correctAnswer: 1,
    explanation: 'Category: western',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'western']
  },
  {
    id: 'movie_453',
    question: 'Who stars in "The Good, the Bad and the Ugly"?',
    options: ['John Wayne', 'Clint Eastwood', 'James Stewart', 'Gary Cooper'],
    correctAnswer: 1,
    explanation: 'Category: western',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'western', 'actors']
  },
  {
    id: 'movie_454',
    question: 'What year was "Unforgiven" released?',
    options: ['1990', '1992', '1994', '1996'],
    correctAnswer: 1,
    explanation: 'Category: western',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'western']
  },
  {
    id: 'movie_455',
    question: 'Who directed "Unforgiven"?',
    options: ['Kevin Costner', 'Clint Eastwood', 'Sam Raimi', 'Quentin Tarantino'],
    correctAnswer: 1,
    explanation: 'Category: western',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'western', 'directors']
  },
  {
    id: 'movie_456',
    question: 'What year was "True Grit" (2010) released?',
    options: ['2008', '2010', '2012', '2014'],
    correctAnswer: 1,
    explanation: 'Category: western',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'western']
  },
  {
    id: 'movie_457',
    question: 'Who directed "True Grit" (2010)?',
    options: ['Quentin Tarantino', 'The Coen Brothers', 'Clint Eastwood', 'Sam Raimi'],
    correctAnswer: 1,
    explanation: 'Category: western',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'western', 'directors']
  },
  {
    id: 'movie_458',
    question: 'What year was "The Hateful Eight" released?',
    options: ['2013', '2015', '2017', '2019'],
    correctAnswer: 1,
    explanation: 'Category: western',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'western']
  },
  {
    id: 'movie_459',
    question: 'Who directed "The Hateful Eight"?',
    options: ['The Coen Brothers', 'Quentin Tarantino', 'Clint Eastwood', 'Taylor Sheridan'],
    correctAnswer: 1,
    explanation: 'Category: western',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'western', 'directors']
  },
  {
    id: 'movie_460',
    question: 'What year was "No Country for Old Men" released?',
    options: ['2005', '2007', '2009', '2011'],
    correctAnswer: 1,
    explanation: 'Category: western',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'western']
  },

  // ============================================================================
  // FANTASY FILMS (461-490)
  // ============================================================================
  {
    id: 'movie_461',
    question: 'What year was "The Princess Bride" released?',
    options: ['1985', '1987', '1989', '1991'],
    correctAnswer: 1,
    explanation: 'Category: fantasy',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'fantasy']
  },
  {
    id: 'movie_462',
    question: 'Who plays Westley in "The Princess Bride"?',
    options: ['Robin Wright', 'Cary Elwes', 'Mandy Patinkin', 'Chris Sarandon'],
    correctAnswer: 1,
    explanation: 'Category: fantasy',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'fantasy', 'actors']
  },
  {
    id: 'movie_463',
    question: 'What year was "Labyrinth" released?',
    options: ['1984', '1986', '1988', '1990'],
    correctAnswer: 1,
    explanation: 'Category: fantasy',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'fantasy']
  },
  {
    id: 'movie_464',
    question: 'Who plays the Goblin King in "Labyrinth"?',
    options: ['Tim Curry', 'David Bowie', 'Gary Oldman', 'Alan Rickman'],
    correctAnswer: 1,
    explanation: 'Category: fantasy',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'fantasy', 'actors']
  },
  {
    id: 'movie_465',
    question: 'What year was "Pan\'s Labyrinth" released?',
    options: ['2004', '2006', '2008', '2010'],
    correctAnswer: 1,
    explanation: 'Category: fantasy',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'fantasy']
  },
  {
    id: 'movie_466',
    question: 'Who directed "Pan\'s Labyrinth"?',
    options: ['Alfonso Cuarón', 'Guillermo del Toro', 'Alejandro González Iñárritu', 'Pedro Almodóvar'],
    correctAnswer: 1,
    explanation: 'Category: fantasy',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'fantasy', 'directors']
  },
  {
    id: 'movie_467',
    question: 'What year was "The NeverEnding Story" released?',
    options: ['1982', '1984', '1986', '1988'],
    correctAnswer: 1,
    explanation: 'Category: fantasy',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'fantasy']
  },
  {
    id: 'movie_468',
    question: 'What is the name of the luck dragon in "The NeverEnding Story"?',
    options: ['Artax', 'Falkor', 'Morla', 'Gmork'],
    correctAnswer: 1,
    explanation: 'Category: fantasy',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'fantasy']
  },
  {
    id: 'movie_469',
    question: 'What year was "Willow" released?',
    options: ['1986', '1988', '1990', '1992'],
    correctAnswer: 1,
    explanation: 'Category: fantasy',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'fantasy']
  },
  {
    id: 'movie_470',
    question: 'Who directed "Willow"?',
    options: ['George Lucas', 'Ron Howard', 'Steven Spielberg', 'Robert Zemeckis'],
    correctAnswer: 1,
    explanation: 'Category: fantasy',
    difficulty: 'expert',
    category: 'movies',
    points: 3,
    tags: ['movies', 'fantasy', 'directors']
  },

  // ============================================================================
  // PIXAR FILMS (471-500)
  // ============================================================================
  {
    id: 'movie_471',
    question: 'What year was "The Incredibles" released?',
    options: ['2002', '2004', '2006', '2008'],
    correctAnswer: 1,
    explanation: 'Category: pixar',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'pixar', 'animation']
  },
  {
    id: 'movie_472',
    question: 'Who directed "The Incredibles"?',
    options: ['John Lasseter', 'Brad Bird', 'Pete Docter', 'Andrew Stanton'],
    correctAnswer: 1,
    explanation: 'Category: pixar',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'pixar', 'directors']
  },
  {
    id: 'movie_473',
    question: 'What year was "Ratatouille" released?',
    options: ['2005', '2007', '2009', '2011'],
    correctAnswer: 1,
    explanation: 'Category: pixar',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'pixar', 'animation']
  },
  {
    id: 'movie_474',
    question: 'What is the rat\'s name in "Ratatouille"?',
    options: ['Emile', 'Remy', 'Alfredo', 'Gusteau'],
    correctAnswer: 1,
    explanation: 'Category: pixar',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'pixar', 'animation']
  },
  {
    id: 'movie_475',
    question: 'What year was "Monsters, Inc." released?',
    options: ['1999', '2001', '2003', '2005'],
    correctAnswer: 1,
    explanation: 'Category: pixar',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'pixar', 'animation']
  },
  {
    id: 'movie_476',
    question: 'Who voices Sulley in "Monsters, Inc."?',
    options: ['Billy Crystal', 'John Goodman', 'Steve Buscemi', 'James Coburn'],
    correctAnswer: 1,
    explanation: 'Category: pixar',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'pixar', 'actors']
  },
  {
    id: 'movie_477',
    question: 'Who voices Mike Wazowski in "Monsters, Inc."?',
    options: ['John Goodman', 'Billy Crystal', 'Steve Buscemi', 'James Coburn'],
    correctAnswer: 1,
    explanation: 'Category: pixar',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'pixar', 'actors']
  },
  {
    id: 'movie_478',
    question: 'What year was "Brave" released?',
    options: ['2010', '2012', '2014', '2016'],
    correctAnswer: 1,
    explanation: 'Category: pixar',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'pixar', 'animation']
  },
  {
    id: 'movie_479',
    question: 'What is the main character\'s name in "Brave"?',
    options: ['Moana', 'Merida', 'Elsa', 'Rapunzel'],
    correctAnswer: 1,
    explanation: 'Category: pixar',
    difficulty: 'casual',
    category: 'movies',
    points: 1,
    tags: ['movies', 'pixar', 'animation']
  },
  {
    id: 'movie_480',
    question: 'What year was "Soul" released?',
    options: ['2018', '2020', '2022', '2024'],
    correctAnswer: 1,
    explanation: 'Category: pixar',
    difficulty: 'moderate',
    category: 'movies',
    points: 2,
    tags: ['movies', 'pixar', 'animation']
  },


  // ============================================================================
  // MORE GENERAL TRIVIA (481-500)
  // ============================================================================
  {
    id: 'movie_481',
    question: 'What is the name of the fictional newspaper in "Spider-Man"?',
    options: ['The Gotham Times', 'The Daily Bugle', 'The Daily Planet', 'The New York Gazette'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'casual',
    category: 'general',
    points: 1,
    tags: ['movies', 'general']
  },
  {
    id: 'movie_482',
    question: 'What is the name of the fictional newspaper in "Superman"?',
    options: ['The Gotham Times', 'The Daily Bugle', 'The Daily Planet', 'The Metropolis Post'],
    correctAnswer: 2,
    explanation: 'Category: general',
    difficulty: 'casual',
    category: 'general',
    points: 1,
    tags: ['movies', 'general']
  },
  {
    id: 'movie_483',
    question: 'What is Batman\'s real name?',
    options: ['Clark Kent', 'Bruce Wayne', 'Peter Parker', 'Tony Stark'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'casual',
    category: 'general',
    points: 1,
    tags: ['movies', 'general']
  },
  {
    id: 'movie_484',
    question: 'What is Superman\'s real name?',
    options: ['Bruce Wayne', 'Clark Kent', 'Kal-El', 'Barry Allen'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'casual',
    category: 'general',
    points: 1,
    tags: ['movies', 'general']
  },
  {
    id: 'movie_485',
    question: 'What is Spider-Man\'s real name?',
    options: ['Bruce Wayne', 'Clark Kent', 'Peter Parker', 'Tony Stark'],
    correctAnswer: 2,
    explanation: 'Category: general',
    difficulty: 'casual',
    category: 'general',
    points: 1,
    tags: ['movies', 'general']
  },
  {
    id: 'movie_486',
    question: 'What city does Batman protect?',
    options: ['Metropolis', 'Gotham City', 'Central City', 'Star City'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'casual',
    category: 'general',
    points: 1,
    tags: ['movies', 'general']
  },
  {
    id: 'movie_487',
    question: 'What city does Superman protect?',
    options: ['Gotham City', 'Metropolis', 'Central City', 'Star City'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'casual',
    category: 'general',
    points: 1,
    tags: ['movies', 'general']
  },
  {
    id: 'movie_488',
    question: 'What is the name of James Bond\'s boss?',
    options: ['Q', 'M', 'Moneypenny', 'Felix'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'moderate',
    category: 'general',
    points: 2,
    tags: ['movies', 'general']
  },
  {
    id: 'movie_489',
    question: 'What is James Bond\'s code number?',
    options: ['001', '007', '008', '009'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'casual',
    category: 'general',
    points: 1,
    tags: ['movies', 'general']
  },
  {
    id: 'movie_490',
    question: 'What is the name of the robot in "The Iron Giant"?',
    options: ['Optimus', 'The Iron Giant', 'Megatron', 'Bumblebee'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'casual',
    category: 'general',
    points: 1,
    tags: ['movies', 'general', 'animation']
  },
  {
    id: 'movie_491',
    question: 'What year was "The Iron Giant" released?',
    options: ['1997', '1999', '2001', '2003'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'moderate',
    category: 'general',
    points: 2,
    tags: ['movies', 'general', 'animation']
  },
  {
    id: 'movie_492',
    question: 'Who directed "The Iron Giant"?',
    options: ['Pete Docter', 'Brad Bird', 'John Lasseter', 'Andrew Stanton'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'expert',
    category: 'general',
    points: 3,
    tags: ['movies', 'general', 'directors']
  },
  {
    id: 'movie_493',
    question: 'What is the name of the dog in "Up"?',
    options: ['Max', 'Dug', 'Buddy', 'Rex'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'casual',
    category: 'general',
    points: 1,
    tags: ['movies', 'general', 'animation']
  },
  {
    id: 'movie_494',
    question: 'What is the name of the bird in "Up"?',
    options: ['Kevin', 'Russell', 'Carl', 'Charles'],
    correctAnswer: 0,
    explanation: 'Category: general',
    difficulty: 'moderate',
    category: 'general',
    points: 2,
    tags: ['movies', 'general', 'animation']
  },
  {
    id: 'movie_495',
    question: 'What is the name of the fish in "Finding Nemo" who forgets things?',
    options: ['Nemo', 'Marlin', 'Dory', 'Gill'],
    correctAnswer: 2,
    explanation: 'Category: general',
    difficulty: 'casual',
    category: 'general',
    points: 1,
    tags: ['movies', 'general', 'animation']
  },
  {
    id: 'movie_496',
    question: 'What is the name of Nemo\'s father?',
    options: ['Gill', 'Marlin', 'Bruce', 'Crush'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'casual',
    category: 'general',
    points: 1,
    tags: ['movies', 'general', 'animation']
  },
  {
    id: 'movie_497',
    question: 'What is the name of the sea turtle in "Finding Nemo"?',
    options: ['Squirt', 'Crush', 'Bruce', 'Gill'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'moderate',
    category: 'general',
    points: 2,
    tags: ['movies', 'general', 'animation']
  },
  {
    id: 'movie_498',
    question: 'What is the name of the shark in "Finding Nemo"?',
    options: ['Crush', 'Gill', 'Bruce', 'Anchor'],
    correctAnswer: 2,
    explanation: 'Category: general',
    difficulty: 'moderate',
    category: 'general',
    points: 2,
    tags: ['movies', 'general', 'animation']
  },
  {
    id: 'movie_499',
    question: 'What is the name of Woody\'s owner in "Toy Story"?',
    options: ['Sid', 'Andy', 'Bonnie', 'Al'],
    correctAnswer: 1,
    explanation: 'Category: general',
    difficulty: 'casual',
    category: 'general',
    points: 1,
    tags: ['movies', 'general', 'animation']
  },
  {
    id: 'movie_500',
    question: 'What is the name of the villain in "Toy Story 2"?',
    options: ['Sid', 'Lotso', 'Al', 'Stinky Pete'],
    correctAnswer: 2,
    explanation: 'Category: general',
    difficulty: 'moderate',
    category: 'general',
    points: 2,
    tags: ['movies', 'general', 'animation']
  }
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get random questions from the movie quiz pool
 * @param count Number of questions to return
 * @param category Optional category filter
 * @param difficulty Optional difficulty filter
 * @returns Array of random quiz questions
 */
export function getRandomMovieQuestions(
  count: number = 10,
  category?: string,
  difficulty?: 'casual' | 'moderate' | 'expert'
): QuizQuestion[] {
  let filtered = [...movieQuizQuestions]
  
  if (category) {
    filtered = filtered.filter(q => q.category === category || q.tags.includes(category))
  }
  
  if (difficulty) {
    filtered = filtered.filter(q => q.difficulty === difficulty)
  }
  
  // Shuffle and return requested count
  const shuffled = filtered.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

/**
 * Get questions by specific category
 */
export function getMovieQuestionsByCategory(category: string): QuizQuestion[] {
  return movieQuizQuestions.filter(q => q.category === category || q.tags.includes(category))
}

/**
 * Get all available categories
 */
export function getMovieCategories(): string[] {
  const categories = new Set<string>()
  movieQuizQuestions.forEach(q => {
    categories.add(q.category)
    q.tags.forEach(tag => categories.add(tag))
  })
  return Array.from(categories).filter(c => c !== 'movies')
}

/**
 * Get total question count
 */
export function getMovieQuestionCount(): number {
  return movieQuizQuestions.length
}

export default movieQuizQuestions
