/**
 * Movie Quiz Question Database
 * Comprehensive movie trivia for survival game
 * Total questions: 500+
 */

import type { QuizQuestion } from '@/types/quiz'

export const movieQuizQuestions: QuizQuestion[] = [
  // ============================================================================
  // CLASSIC FILMS (1-25)
  // ============================================================================
  {
    id: 'movie_1',
    question: 'What year was "The Godfather" released?',
    options: ['1970', '1972', '1974', '1976'],
    correctAnswer: 1,
    explanation: 'The Godfather was released in 1972',
    difficulty: 'moderate',
    category: 'classic',
    points: 2,
    tags: ['movies', 'classic']
  },
  {
    id: 'movie_2',
    question: 'Who directed "Citizen Kane"?',
    options: ['Alfred Hitchcock', 'Orson Welles', 'John Ford', 'Billy Wilder'],
    correctAnswer: 1,
    explanation: 'Orson Welles directed Citizen Kane',
    difficulty: 'moderate',
    category: 'classic',
    points: 2,
    tags: ['movies', 'classic', 'directors']
  },
  {
    id: 'movie_3',
    question: 'What is the name of the sled in "Citizen Kane"?',
    options: ['Rosebud', 'Snowflake', 'Winter', 'Childhood'],
    correctAnswer: 0,
    explanation: 'Rosebud is the famous sled',
    difficulty: 'casual',
    category: 'classic',
    points: 1,
    tags: ['movies', 'classic']
  },
  {
    id: 'movie_4',
    question: 'Who played Scarlett O\'Hara in "Gone with the Wind"?',
    options: ['Bette Davis', 'Vivien Leigh', 'Katharine Hepburn', 'Joan Crawford'],
    correctAnswer: 1,
    explanation: 'Vivien Leigh played Scarlett O\'Hara',
    difficulty: 'moderate',
    category: 'classic',
    points: 2,
    tags: ['movies', 'classic', 'actors']
  },

  {
    id: 'movie_5',
    question: 'Who directed "Psycho" (1960)?',
    options: ['Stanley Kubrick', 'Alfred Hitchcock', 'Roman Polanski', 'William Friedkin'],
    correctAnswer: 1,
    explanation: 'Alfred Hitchcock directed Psycho',
    difficulty: 'casual',
    category: 'classic',
    points: 1,
    tags: ['movies', 'classic', 'directors']
  },
  {
    id: 'movie_6',
    question: 'Who played Don Vito Corleone in "The Godfather"?',
    options: ['Al Pacino', 'Robert De Niro', 'Marlon Brando', 'James Caan'],
    correctAnswer: 2,
    explanation: 'Marlon Brando played Don Vito Corleone',
    difficulty: 'casual',
    category: 'classic',
    points: 1,
    tags: ['movies', 'classic', 'actors']
  },
  {
    id: 'movie_7',
    question: 'Who directed "It\'s a Wonderful Life"?',
    options: ['John Ford', 'Frank Capra', 'Howard Hawks', 'William Wyler'],
    correctAnswer: 1,
    explanation: 'Frank Capra directed It\'s a Wonderful Life',
    difficulty: 'moderate',
    category: 'classic',
    points: 2,
    tags: ['movies', 'classic', 'directors']
  },
  {
    id: 'movie_8',
    question: 'What is the angel\'s name in "It\'s a Wonderful Life"?',
    options: ['Gabriel', 'Michael', 'Clarence', 'Joseph'],
    correctAnswer: 2,
    explanation: 'Clarence is the angel',
    difficulty: 'casual',
    category: 'classic',
    points: 1,
    tags: ['movies', 'classic']
  },
  {
    id: 'movie_9',
    question: 'Who played Norman Bates in "Psycho"?',
    options: ['James Stewart', 'Anthony Perkins', 'Cary Grant', 'Rock Hudson'],
    correctAnswer: 1,
    explanation: 'Anthony Perkins played Norman Bates',
    difficulty: 'moderate',
    category: 'classic',
    points: 2,
    tags: ['movies', 'classic', 'actors']
  },
  {
    id: 'movie_10',
    question: 'What year was "Casablanca" released?',
    options: ['1940', '1942', '1944', '1946'],
    correctAnswer: 1,
    explanation: 'Casablanca was released in 1942',
    difficulty: 'moderate',
    category: 'classic',
    points: 2,
    tags: ['movies', 'classic']
  },

  // ============================================================================
  // BLOCKBUSTERS (11-35)
  // ============================================================================
  {
    id: 'movie_11',
    question: 'What year was the first "Star Wars" film released?',
    options: ['1975', '1977', '1979', '1981'],
    correctAnswer: 1,
    explanation: 'Star Wars was released in 1977',
    difficulty: 'casual',
    category: 'blockbuster',
    points: 1,
    tags: ['movies', 'blockbuster', 'scifi']
  },
  {
    id: 'movie_12',
    question: 'Who directed "Jaws"?',
    options: ['George Lucas', 'Steven Spielberg', 'Francis Ford Coppola', 'Martin Scorsese'],
    correctAnswer: 1,
    explanation: 'Steven Spielberg directed Jaws',
    difficulty: 'casual',
    category: 'blockbuster',
    points: 1,
    tags: ['movies', 'blockbuster', 'directors']
  },
  {
    id: 'movie_13',
    question: 'Who played Jack in "Titanic"?',
    options: ['Brad Pitt', 'Leonardo DiCaprio', 'Matt Damon', 'Johnny Depp'],
    correctAnswer: 1,
    explanation: 'Leonardo DiCaprio played Jack',
    difficulty: 'casual',
    category: 'blockbuster',
    points: 1,
    tags: ['movies', 'blockbuster', 'actors']
  },
  {
    id: 'movie_14',
    question: 'What year was "Titanic" released?',
    options: ['1995', '1997', '1999', '2001'],
    correctAnswer: 1,
    explanation: 'Titanic was released in 1997',
    difficulty: 'casual',
    category: 'blockbuster',
    points: 1,
    tags: ['movies', 'blockbuster']
  },
  {
    id: 'movie_15',
    question: 'Who directed "Avatar" (2009)?',
    options: ['Steven Spielberg', 'James Cameron', 'Peter Jackson', 'Christopher Nolan'],
    correctAnswer: 1,
    explanation: 'James Cameron directed Avatar',
    difficulty: 'casual',
    category: 'blockbuster',
    points: 1,
    tags: ['movies', 'blockbuster', 'directors']
  },
  {
    id: 'movie_16',
    question: 'What is the name of the planet in "Avatar"?',
    options: ['Pandora', 'Endor', 'Tatooine', 'Naboo'],
    correctAnswer: 0,
    explanation: 'The planet is called Pandora',
    difficulty: 'casual',
    category: 'blockbuster',
    points: 1,
    tags: ['movies', 'blockbuster', 'scifi']
  },
  {
    id: 'movie_17',
    question: 'What year was "Jurassic Park" released?',
    options: ['1991', '1993', '1995', '1997'],
    correctAnswer: 1,
    explanation: 'Jurassic Park was released in 1993',
    difficulty: 'casual',
    category: 'blockbuster',
    points: 1,
    tags: ['movies', 'blockbuster']
  },
  {
    id: 'movie_18',
    question: 'Who played Indiana Jones?',
    options: ['Tom Selleck', 'Harrison Ford', 'Kurt Russell', 'Mel Gibson'],
    correctAnswer: 1,
    explanation: 'Harrison Ford played Indiana Jones',
    difficulty: 'casual',
    category: 'blockbuster',
    points: 1,
    tags: ['movies', 'blockbuster', 'actors']
  },
  {
    id: 'movie_19',
    question: 'What year was "The Matrix" released?',
    options: ['1997', '1999', '2001', '2003'],
    correctAnswer: 1,
    explanation: 'The Matrix was released in 1999',
    difficulty: 'casual',
    category: 'blockbuster',
    points: 1,
    tags: ['movies', 'blockbuster', 'scifi']
  },
  {
    id: 'movie_20',
    question: 'Who played Neo in "The Matrix"?',
    options: ['Brad Pitt', 'Keanu Reeves', 'Nicolas Cage', 'Johnny Depp'],
    correctAnswer: 1,
    explanation: 'Keanu Reeves played Neo',
    difficulty: 'casual',
    category: 'blockbuster',
    points: 1,
    tags: ['movies', 'blockbuster', 'actors']
  },

  {
    id: 'movie_21',
    question: 'What color pill does Neo take in "The Matrix"?',
    options: ['Blue', 'Red', 'Green', 'Yellow'],
    correctAnswer: 1,
    explanation: 'Neo takes the red pill',
    difficulty: 'casual',
    category: 'blockbuster',
    points: 1,
    tags: ['movies', 'blockbuster']
  },
  {
    id: 'movie_22',
    question: 'Who directed "The Dark Knight"?',
    options: ['Tim Burton', 'Christopher Nolan', 'Zack Snyder', 'Matt Reeves'],
    correctAnswer: 1,
    explanation: 'Christopher Nolan directed The Dark Knight',
    difficulty: 'casual',
    category: 'blockbuster',
    points: 1,
    tags: ['movies', 'blockbuster', 'directors']
  },
  {
    id: 'movie_23',
    question: 'Who played the Joker in "The Dark Knight"?',
    options: ['Jack Nicholson', 'Heath Ledger', 'Jared Leto', 'Joaquin Phoenix'],
    correctAnswer: 1,
    explanation: 'Heath Ledger played the Joker',
    difficulty: 'casual',
    category: 'blockbuster',
    points: 1,
    tags: ['movies', 'blockbuster', 'actors']
  },
  {
    id: 'movie_24',
    question: 'Who directed "Inception"?',
    options: ['Steven Spielberg', 'Christopher Nolan', 'Denis Villeneuve', 'Ridley Scott'],
    correctAnswer: 1,
    explanation: 'Christopher Nolan directed Inception',
    difficulty: 'casual',
    category: 'blockbuster',
    points: 1,
    tags: ['movies', 'blockbuster', 'directors']
  },
  {
    id: 'movie_25',
    question: 'Who played Tony Stark/Iron Man in the MCU?',
    options: ['Chris Evans', 'Robert Downey Jr.', 'Chris Hemsworth', 'Mark Ruffalo'],
    correctAnswer: 1,
    explanation: 'Robert Downey Jr. played Iron Man',
    difficulty: 'casual',
    category: 'blockbuster',
    points: 1,
    tags: ['movies', 'blockbuster', 'mcu']
  },

  // ============================================================================
  // DIRECTORS (26-50)
  // ============================================================================
  {
    id: 'movie_26',
    question: 'Who directed "Pulp Fiction"?',
    options: ['Martin Scorsese', 'Quentin Tarantino', 'David Fincher', 'Coen Brothers'],
    correctAnswer: 1,
    explanation: 'Quentin Tarantino directed Pulp Fiction',
    difficulty: 'casual',
    category: 'directors',
    points: 1,
    tags: ['movies', 'directors']
  },
  {
    id: 'movie_27',
    question: 'Who directed "Schindler\'s List"?',
    options: ['Steven Spielberg', 'Roman Polanski', 'Martin Scorsese', 'Oliver Stone'],
    correctAnswer: 0,
    explanation: 'Steven Spielberg directed Schindler\'s List',
    difficulty: 'casual',
    category: 'directors',
    points: 1,
    tags: ['movies', 'directors']
  },
  {
    id: 'movie_28',
    question: 'Who directed "2001: A Space Odyssey"?',
    options: ['Ridley Scott', 'Stanley Kubrick', 'Steven Spielberg', 'George Lucas'],
    correctAnswer: 1,
    explanation: 'Stanley Kubrick directed 2001',
    difficulty: 'moderate',
    category: 'directors',
    points: 2,
    tags: ['movies', 'directors', 'scifi']
  },
  {
    id: 'movie_29',
    question: 'Who directed "The Shining"?',
    options: ['John Carpenter', 'Stanley Kubrick', 'Wes Craven', 'Tobe Hooper'],
    correctAnswer: 1,
    explanation: 'Stanley Kubrick directed The Shining',
    difficulty: 'casual',
    category: 'directors',
    points: 1,
    tags: ['movies', 'directors', 'horror']
  },
  {
    id: 'movie_30',
    question: 'Who directed "Goodfellas"?',
    options: ['Francis Ford Coppola', 'Martin Scorsese', 'Brian De Palma', 'Quentin Tarantino'],
    correctAnswer: 1,
    explanation: 'Martin Scorsese directed Goodfellas',
    difficulty: 'casual',
    category: 'directors',
    points: 1,
    tags: ['movies', 'directors']
  },
  {
    id: 'movie_31',
    question: 'Who directed "Fight Club"?',
    options: ['Christopher Nolan', 'David Fincher', 'Darren Aronofsky', 'Denis Villeneuve'],
    correctAnswer: 1,
    explanation: 'David Fincher directed Fight Club',
    difficulty: 'casual',
    category: 'directors',
    points: 1,
    tags: ['movies', 'directors']
  },
  {
    id: 'movie_32',
    question: 'Who directed "Blade Runner"?',
    options: ['James Cameron', 'Ridley Scott', 'Paul Verhoeven', 'John Carpenter'],
    correctAnswer: 1,
    explanation: 'Ridley Scott directed Blade Runner',
    difficulty: 'moderate',
    category: 'directors',
    points: 2,
    tags: ['movies', 'directors', 'scifi']
  },
  {
    id: 'movie_33',
    question: 'Who directed "Alien" (1979)?',
    options: ['James Cameron', 'Ridley Scott', 'John Carpenter', 'David Cronenberg'],
    correctAnswer: 1,
    explanation: 'Ridley Scott directed Alien',
    difficulty: 'moderate',
    category: 'directors',
    points: 2,
    tags: ['movies', 'directors', 'scifi']
  },
  {
    id: 'movie_34',
    question: 'Who directed "The Lord of the Rings" trilogy?',
    options: ['Steven Spielberg', 'Peter Jackson', 'Guillermo del Toro', 'Sam Raimi'],
    correctAnswer: 1,
    explanation: 'Peter Jackson directed LOTR',
    difficulty: 'casual',
    category: 'directors',
    points: 1,
    tags: ['movies', 'directors', 'fantasy']
  },
  {
    id: 'movie_35',
    question: 'Who directed "Forrest Gump"?',
    options: ['Steven Spielberg', 'Robert Zemeckis', 'Ron Howard', 'Barry Levinson'],
    correctAnswer: 1,
    explanation: 'Robert Zemeckis directed Forrest Gump',
    difficulty: 'moderate',
    category: 'directors',
    points: 2,
    tags: ['movies', 'directors']
  },
  {
    id: 'movie_36',
    question: 'Who directed "Back to the Future"?',
    options: ['Steven Spielberg', 'Robert Zemeckis', 'Joe Dante', 'Richard Donner'],
    correctAnswer: 1,
    explanation: 'Robert Zemeckis directed Back to the Future',
    difficulty: 'moderate',
    category: 'directors',
    points: 2,
    tags: ['movies', 'directors']
  },
  {
    id: 'movie_37',
    question: 'Who directed "Se7en"?',
    options: ['Christopher Nolan', 'David Fincher', 'Denis Villeneuve', 'Darren Aronofsky'],
    correctAnswer: 1,
    explanation: 'David Fincher directed Se7en',
    difficulty: 'moderate',
    category: 'directors',
    points: 2,
    tags: ['movies', 'directors']
  },
  {
    id: 'movie_38',
    question: 'Who directed "Kill Bill"?',
    options: ['Robert Rodriguez', 'Quentin Tarantino', 'Guy Ritchie', 'Matthew Vaughn'],
    correctAnswer: 1,
    explanation: 'Quentin Tarantino directed Kill Bill',
    difficulty: 'casual',
    category: 'directors',
    points: 1,
    tags: ['movies', 'directors']
  },
  {
    id: 'movie_39',
    question: 'Who directed "The Departed"?',
    options: ['Brian De Palma', 'Martin Scorsese', 'Michael Mann', 'Ridley Scott'],
    correctAnswer: 1,
    explanation: 'Martin Scorsese directed The Departed',
    difficulty: 'moderate',
    category: 'directors',
    points: 2,
    tags: ['movies', 'directors']
  },
  {
    id: 'movie_40',
    question: 'Who directed "Interstellar"?',
    options: ['Denis Villeneuve', 'Christopher Nolan', 'Ridley Scott', 'Alfonso Cuarón'],
    correctAnswer: 1,
    explanation: 'Christopher Nolan directed Interstellar',
    difficulty: 'casual',
    category: 'directors',
    points: 1,
    tags: ['movies', 'directors', 'scifi']
  },

  {
    id: 'movie_41',
    question: 'Who directed "Dune" (2021)?',
    options: ['Christopher Nolan', 'Denis Villeneuve', 'Ridley Scott', 'David Lynch'],
    correctAnswer: 1,
    explanation: 'Denis Villeneuve directed Dune',
    difficulty: 'casual',
    category: 'directors',
    points: 1,
    tags: ['movies', 'directors', 'scifi']
  },
  {
    id: 'movie_42',
    question: 'Who directed "Parasite"?',
    options: ['Park Chan-wook', 'Bong Joon-ho', 'Kim Jee-woon', 'Lee Chang-dong'],
    correctAnswer: 1,
    explanation: 'Bong Joon-ho directed Parasite',
    difficulty: 'moderate',
    category: 'directors',
    points: 2,
    tags: ['movies', 'directors']
  },

  // ============================================================================
  // ACADEMY AWARDS (43-67)
  // ============================================================================
  {
    id: 'movie_43',
    question: 'Which film won Best Picture at the 2020 Oscars?',
    options: ['1917', 'Joker', 'Parasite', 'Once Upon a Time in Hollywood'],
    correctAnswer: 2,
    explanation: 'Parasite won Best Picture',
    difficulty: 'casual',
    category: 'awards',
    points: 1,
    tags: ['movies', 'awards']
  },
  {
    id: 'movie_44',
    question: 'How many Oscars did "Titanic" win?',
    options: ['9', '10', '11', '12'],
    correctAnswer: 2,
    explanation: 'Titanic won 11 Oscars',
    difficulty: 'moderate',
    category: 'awards',
    points: 2,
    tags: ['movies', 'awards']
  },
  {
    id: 'movie_45',
    question: 'Who won Best Actor for "Joker" (2019)?',
    options: ['Robert De Niro', 'Joaquin Phoenix', 'Adam Driver', 'Leonardo DiCaprio'],
    correctAnswer: 1,
    explanation: 'Joaquin Phoenix won Best Actor',
    difficulty: 'casual',
    category: 'awards',
    points: 1,
    tags: ['movies', 'awards', 'actors']
  },
  {
    id: 'movie_46',
    question: 'Leonardo DiCaprio won his first Oscar for which film?',
    options: ['The Wolf of Wall Street', 'The Revenant', 'Django Unchained', 'Inception'],
    correctAnswer: 1,
    explanation: 'DiCaprio won for The Revenant',
    difficulty: 'casual',
    category: 'awards',
    points: 1,
    tags: ['movies', 'awards', 'actors']
  },
  {
    id: 'movie_47',
    question: 'Who won Best Actress for "Black Swan"?',
    options: ['Mila Kunis', 'Natalie Portman', 'Winona Ryder', 'Barbara Hershey'],
    correctAnswer: 1,
    explanation: 'Natalie Portman won Best Actress',
    difficulty: 'moderate',
    category: 'awards',
    points: 2,
    tags: ['movies', 'awards', 'actors']
  },
  {
    id: 'movie_48',
    question: 'Which film won Best Picture in 2023?',
    options: ['Everything Everywhere All at Once', 'The Banshees of Inisherin', 'Top Gun: Maverick', 'Avatar: The Way of Water'],
    correctAnswer: 0,
    explanation: 'Everything Everywhere All at Once won',
    difficulty: 'casual',
    category: 'awards',
    points: 1,
    tags: ['movies', 'awards']
  },
  {
    id: 'movie_49',
    question: 'Which film won Best Picture in 2024?',
    options: ['Oppenheimer', 'Barbie', 'Killers of the Flower Moon', 'Poor Things'],
    correctAnswer: 0,
    explanation: 'Oppenheimer won Best Picture',
    difficulty: 'casual',
    category: 'awards',
    points: 1,
    tags: ['movies', 'awards']
  },
  {
    id: 'movie_50',
    question: 'Who won Best Director for "Oppenheimer"?',
    options: ['Martin Scorsese', 'Christopher Nolan', 'Greta Gerwig', 'Yorgos Lanthimos'],
    correctAnswer: 1,
    explanation: 'Christopher Nolan won Best Director',
    difficulty: 'casual',
    category: 'awards',
    points: 1,
    tags: ['movies', 'awards', 'directors']
  },

  // ============================================================================
  // FAMOUS QUOTES (51-75)
  // ============================================================================
  {
    id: 'movie_51',
    question: '"I\'ll be back" is from which movie?',
    options: ['Predator', 'The Terminator', 'Total Recall', 'Commando'],
    correctAnswer: 1,
    explanation: 'The Terminator (1984)',
    difficulty: 'casual',
    category: 'quotes',
    points: 1,
    tags: ['movies', 'quotes']
  },
  {
    id: 'movie_52',
    question: '"May the Force be with you" is from which franchise?',
    options: ['Star Trek', 'Star Wars', 'Battlestar Galactica', 'Stargate'],
    correctAnswer: 1,
    explanation: 'Star Wars',
    difficulty: 'casual',
    category: 'quotes',
    points: 1,
    tags: ['movies', 'quotes', 'scifi']
  },
  {
    id: 'movie_53',
    question: '"You talking to me?" is from which movie?',
    options: ['Goodfellas', 'Taxi Driver', 'Raging Bull', 'Mean Streets'],
    correctAnswer: 1,
    explanation: 'Taxi Driver (1976)',
    difficulty: 'moderate',
    category: 'quotes',
    points: 2,
    tags: ['movies', 'quotes']
  },
  {
    id: 'movie_54',
    question: '"I\'m gonna make him an offer he can\'t refuse" is from?',
    options: ['Scarface', 'The Godfather', 'Goodfellas', 'Casino'],
    correctAnswer: 1,
    explanation: 'The Godfather',
    difficulty: 'casual',
    category: 'quotes',
    points: 1,
    tags: ['movies', 'quotes']
  },
  {
    id: 'movie_55',
    question: '"Here\'s Johnny!" is from which movie?',
    options: ['Psycho', 'The Shining', 'A Nightmare on Elm Street', 'Halloween'],
    correctAnswer: 1,
    explanation: 'The Shining',
    difficulty: 'casual',
    category: 'quotes',
    points: 1,
    tags: ['movies', 'quotes', 'horror']
  },
  {
    id: 'movie_56',
    question: '"You can\'t handle the truth!" is from which movie?',
    options: ['The Firm', 'A Few Good Men', 'Jerry Maguire', 'Top Gun'],
    correctAnswer: 1,
    explanation: 'A Few Good Men',
    difficulty: 'casual',
    category: 'quotes',
    points: 1,
    tags: ['movies', 'quotes']
  },
  {
    id: 'movie_57',
    question: '"Life is like a box of chocolates" is from?',
    options: ['Big', 'Forrest Gump', 'Cast Away', 'The Green Mile'],
    correctAnswer: 1,
    explanation: 'Forrest Gump',
    difficulty: 'casual',
    category: 'quotes',
    points: 1,
    tags: ['movies', 'quotes']
  },
  {
    id: 'movie_58',
    question: '"I see dead people" is from which movie?',
    options: ['The Others', 'The Sixth Sense', 'Ghost', 'Poltergeist'],
    correctAnswer: 1,
    explanation: 'The Sixth Sense',
    difficulty: 'casual',
    category: 'quotes',
    points: 1,
    tags: ['movies', 'quotes']
  },
  {
    id: 'movie_59',
    question: '"Why so serious?" is from which movie?',
    options: ['Batman Begins', 'The Dark Knight', 'The Dark Knight Rises', 'Joker'],
    correctAnswer: 1,
    explanation: 'The Dark Knight',
    difficulty: 'casual',
    category: 'quotes',
    points: 1,
    tags: ['movies', 'quotes']
  },
  {
    id: 'movie_60',
    question: '"I am your father" is from which Star Wars film?',
    options: ['A New Hope', 'The Empire Strikes Back', 'Return of the Jedi', 'Revenge of the Sith'],
    correctAnswer: 1,
    explanation: 'The Empire Strikes Back',
    difficulty: 'casual',
    category: 'quotes',
    points: 1,
    tags: ['movies', 'quotes', 'scifi']
  },

  {
    id: 'movie_61',
    question: '"To infinity and beyond!" is from which movie?',
    options: ['Toy Story', 'WALL-E', 'Up', 'Finding Nemo'],
    correctAnswer: 0,
    explanation: 'Toy Story',
    difficulty: 'casual',
    category: 'quotes',
    points: 1,
    tags: ['movies', 'quotes', 'animation']
  },
  {
    id: 'movie_62',
    question: '"My precious" is from which franchise?',
    options: ['Harry Potter', 'The Lord of the Rings', 'The Hobbit', 'Chronicles of Narnia'],
    correctAnswer: 1,
    explanation: 'The Lord of the Rings',
    difficulty: 'casual',
    category: 'quotes',
    points: 1,
    tags: ['movies', 'quotes', 'fantasy']
  },
  {
    id: 'movie_63',
    question: '"I\'m the king of the world!" is from which movie?',
    options: ['The Wolf of Wall Street', 'Titanic', 'Catch Me If You Can', 'The Aviator'],
    correctAnswer: 1,
    explanation: 'Titanic',
    difficulty: 'casual',
    category: 'quotes',
    points: 1,
    tags: ['movies', 'quotes']
  },
  {
    id: 'movie_64',
    question: '"Say hello to my little friend!" is from which movie?',
    options: ['The Godfather', 'Scarface', 'Goodfellas', 'Casino'],
    correctAnswer: 1,
    explanation: 'Scarface',
    difficulty: 'casual',
    category: 'quotes',
    points: 1,
    tags: ['movies', 'quotes']
  },
  {
    id: 'movie_65',
    question: '"You shall not pass!" is from which movie?',
    options: ['Harry Potter', 'The Lord of the Rings', 'The Hobbit', 'Willow'],
    correctAnswer: 1,
    explanation: 'The Lord of the Rings',
    difficulty: 'casual',
    category: 'quotes',
    points: 1,
    tags: ['movies', 'quotes', 'fantasy']
  },

  // ============================================================================
  // HORROR MOVIES (66-90)
  // ============================================================================
  {
    id: 'movie_66',
    question: 'What year was "The Exorcist" released?',
    options: ['1971', '1973', '1975', '1977'],
    correctAnswer: 1,
    explanation: 'The Exorcist was released in 1973',
    difficulty: 'moderate',
    category: 'horror',
    points: 2,
    tags: ['movies', 'horror']
  },
  {
    id: 'movie_67',
    question: 'Who directed "Halloween" (1978)?',
    options: ['Wes Craven', 'John Carpenter', 'Tobe Hooper', 'George Romero'],
    correctAnswer: 1,
    explanation: 'John Carpenter directed Halloween',
    difficulty: 'moderate',
    category: 'horror',
    points: 2,
    tags: ['movies', 'horror', 'directors']
  },
  {
    id: 'movie_68',
    question: 'What is the killer\'s name in "Halloween"?',
    options: ['Jason Voorhees', 'Michael Myers', 'Freddy Krueger', 'Leatherface'],
    correctAnswer: 1,
    explanation: 'Michael Myers is the killer',
    difficulty: 'casual',
    category: 'horror',
    points: 1,
    tags: ['movies', 'horror']
  },
  {
    id: 'movie_69',
    question: 'What is the killer\'s name in "Friday the 13th"?',
    options: ['Michael Myers', 'Jason Voorhees', 'Freddy Krueger', 'Ghostface'],
    correctAnswer: 1,
    explanation: 'Jason Voorhees is the killer',
    difficulty: 'casual',
    category: 'horror',
    points: 1,
    tags: ['movies', 'horror']
  },
  {
    id: 'movie_70',
    question: 'Who created "A Nightmare on Elm Street"?',
    options: ['John Carpenter', 'Wes Craven', 'Tobe Hooper', 'Sam Raimi'],
    correctAnswer: 1,
    explanation: 'Wes Craven created the franchise',
    difficulty: 'moderate',
    category: 'horror',
    points: 2,
    tags: ['movies', 'horror', 'directors']
  },
  {
    id: 'movie_71',
    question: 'What is Freddy Krueger\'s weapon of choice?',
    options: ['Machete', 'Chainsaw', 'Glove with blades', 'Axe'],
    correctAnswer: 2,
    explanation: 'Freddy uses a glove with blades',
    difficulty: 'casual',
    category: 'horror',
    points: 1,
    tags: ['movies', 'horror']
  },
  {
    id: 'movie_72',
    question: 'Who directed "Get Out"?',
    options: ['Ari Aster', 'Jordan Peele', 'James Wan', 'Mike Flanagan'],
    correctAnswer: 1,
    explanation: 'Jordan Peele directed Get Out',
    difficulty: 'casual',
    category: 'horror',
    points: 1,
    tags: ['movies', 'horror', 'directors']
  },
  {
    id: 'movie_73',
    question: 'Who directed "Hereditary"?',
    options: ['Jordan Peele', 'Ari Aster', 'Robert Eggers', 'Mike Flanagan'],
    correctAnswer: 1,
    explanation: 'Ari Aster directed Hereditary',
    difficulty: 'moderate',
    category: 'horror',
    points: 2,
    tags: ['movies', 'horror', 'directors']
  },
  {
    id: 'movie_74',
    question: 'Who directed "The Conjuring"?',
    options: ['James Wan', 'Leigh Whannell', 'Mike Flanagan', 'Scott Derrickson'],
    correctAnswer: 0,
    explanation: 'James Wan directed The Conjuring',
    difficulty: 'moderate',
    category: 'horror',
    points: 2,
    tags: ['movies', 'horror', 'directors']
  },
  {
    id: 'movie_75',
    question: 'What hotel is "The Shining" set in?',
    options: ['Bates Motel', 'The Overlook Hotel', 'The Stanley Hotel', 'The Grand Budapest'],
    correctAnswer: 1,
    explanation: 'The Overlook Hotel',
    difficulty: 'moderate',
    category: 'horror',
    points: 2,
    tags: ['movies', 'horror']
  },
  {
    id: 'movie_76',
    question: 'Who played Jack Torrance in "The Shining"?',
    options: ['Robert De Niro', 'Jack Nicholson', 'Al Pacino', 'Dustin Hoffman'],
    correctAnswer: 1,
    explanation: 'Jack Nicholson played Jack Torrance',
    difficulty: 'casual',
    category: 'horror',
    points: 1,
    tags: ['movies', 'horror', 'actors']
  },
  {
    id: 'movie_77',
    question: 'What is the name of the killer in "Scream"?',
    options: ['Michael Myers', 'Jason', 'Ghostface', 'The Creeper'],
    correctAnswer: 2,
    explanation: 'Ghostface is the killer',
    difficulty: 'casual',
    category: 'horror',
    points: 1,
    tags: ['movies', 'horror']
  },
  {
    id: 'movie_78',
    question: 'Who directed "Scream" (1996)?',
    options: ['John Carpenter', 'Wes Craven', 'Sam Raimi', 'Tobe Hooper'],
    correctAnswer: 1,
    explanation: 'Wes Craven directed Scream',
    difficulty: 'moderate',
    category: 'horror',
    points: 2,
    tags: ['movies', 'horror', 'directors']
  },
  {
    id: 'movie_79',
    question: 'How many days do you have after watching the tape in "The Ring"?',
    options: ['3 days', '5 days', '7 days', '10 days'],
    correctAnswer: 2,
    explanation: 'Seven days',
    difficulty: 'casual',
    category: 'horror',
    points: 1,
    tags: ['movies', 'horror']
  },
  {
    id: 'movie_80',
    question: 'What is the clown\'s name in "It"?',
    options: ['Bobo', 'Pennywise', 'Twisty', 'Art'],
    correctAnswer: 1,
    explanation: 'Pennywise the Dancing Clown',
    difficulty: 'casual',
    category: 'horror',
    points: 1,
    tags: ['movies', 'horror']
  },


  // ============================================================================
  // SCI-FI MOVIES (81-105)
  // ============================================================================
  {
    id: 'movie_81',
    question: 'Who directed the original "Star Wars" trilogy?',
    options: ['Steven Spielberg', 'George Lucas', 'James Cameron', 'Ridley Scott'],
    correctAnswer: 1,
    explanation: 'George Lucas directed the original trilogy',
    difficulty: 'casual',
    category: 'scifi',
    points: 1,
    tags: ['movies', 'scifi', 'directors']
  },
  {
    id: 'movie_82',
    question: 'What is the name of Han Solo\'s ship?',
    options: ['X-Wing', 'Millennium Falcon', 'TIE Fighter', 'Star Destroyer'],
    correctAnswer: 1,
    explanation: 'The Millennium Falcon',
    difficulty: 'casual',
    category: 'scifi',
    points: 1,
    tags: ['movies', 'scifi']
  },
  {
    id: 'movie_83',
    question: 'Who played Han Solo in the original trilogy?',
    options: ['Mark Hamill', 'Harrison Ford', 'Carrie Fisher', 'Billy Dee Williams'],
    correctAnswer: 1,
    explanation: 'Harrison Ford played Han Solo',
    difficulty: 'casual',
    category: 'scifi',
    points: 1,
    tags: ['movies', 'scifi', 'actors']
  },
  {
    id: 'movie_84',
    question: 'What is Darth Vader\'s real name?',
    options: ['Luke Skywalker', 'Anakin Skywalker', 'Ben Solo', 'Obi-Wan Kenobi'],
    correctAnswer: 1,
    explanation: 'Anakin Skywalker',
    difficulty: 'casual',
    category: 'scifi',
    points: 1,
    tags: ['movies', 'scifi']
  },
  {
    id: 'movie_85',
    question: 'What year was "Blade Runner" released?',
    options: ['1980', '1982', '1984', '1986'],
    correctAnswer: 1,
    explanation: 'Blade Runner was released in 1982',
    difficulty: 'moderate',
    category: 'scifi',
    points: 2,
    tags: ['movies', 'scifi']
  },
  {
    id: 'movie_86',
    question: 'What are the androids called in "Blade Runner"?',
    options: ['Cylons', 'Replicants', 'Androids', 'Synthetics'],
    correctAnswer: 1,
    explanation: 'They are called Replicants',
    difficulty: 'moderate',
    category: 'scifi',
    points: 2,
    tags: ['movies', 'scifi']
  },
  {
    id: 'movie_87',
    question: 'Who directed "The Terminator"?',
    options: ['Ridley Scott', 'James Cameron', 'Paul Verhoeven', 'John McTiernan'],
    correctAnswer: 1,
    explanation: 'James Cameron directed The Terminator',
    difficulty: 'moderate',
    category: 'scifi',
    points: 2,
    tags: ['movies', 'scifi', 'directors']
  },
  {
    id: 'movie_88',
    question: 'What is the AI called in "2001: A Space Odyssey"?',
    options: ['WALL-E', 'HAL 9000', 'Skynet', 'JARVIS'],
    correctAnswer: 1,
    explanation: 'HAL 9000',
    difficulty: 'moderate',
    category: 'scifi',
    points: 2,
    tags: ['movies', 'scifi']
  },
  {
    id: 'movie_89',
    question: 'What year is "Back to the Future" set in the future?',
    options: ['2010', '2015', '2020', '2025'],
    correctAnswer: 1,
    explanation: 'The future scenes are set in 2015',
    difficulty: 'moderate',
    category: 'scifi',
    points: 2,
    tags: ['movies', 'scifi']
  },
  {
    id: 'movie_90',
    question: 'What car is the time machine in "Back to the Future"?',
    options: ['Corvette', 'DeLorean', 'Mustang', 'Camaro'],
    correctAnswer: 1,
    explanation: 'A DeLorean DMC-12',
    difficulty: 'casual',
    category: 'scifi',
    points: 1,
    tags: ['movies', 'scifi']
  },
  {
    id: 'movie_91',
    question: 'Who played Marty McFly in "Back to the Future"?',
    options: ['Tom Hanks', 'Michael J. Fox', 'Matthew Broderick', 'John Cusack'],
    correctAnswer: 1,
    explanation: 'Michael J. Fox played Marty McFly',
    difficulty: 'casual',
    category: 'scifi',
    points: 1,
    tags: ['movies', 'scifi', 'actors']
  },
  {
    id: 'movie_92',
    question: 'What speed must the DeLorean reach to time travel?',
    options: ['77 mph', '88 mph', '99 mph', '100 mph'],
    correctAnswer: 1,
    explanation: '88 miles per hour',
    difficulty: 'casual',
    category: 'scifi',
    points: 1,
    tags: ['movies', 'scifi']
  },
  {
    id: 'movie_93',
    question: 'Who played Ellen Ripley in "Alien"?',
    options: ['Jamie Lee Curtis', 'Sigourney Weaver', 'Linda Hamilton', 'Jodie Foster'],
    correctAnswer: 1,
    explanation: 'Sigourney Weaver played Ripley',
    difficulty: 'moderate',
    category: 'scifi',
    points: 2,
    tags: ['movies', 'scifi', 'actors']
  },
  {
    id: 'movie_94',
    question: 'What is the name of the ship in "Alien"?',
    options: ['Sulaco', 'Nostromo', 'Prometheus', 'Covenant'],
    correctAnswer: 1,
    explanation: 'The Nostromo',
    difficulty: 'moderate',
    category: 'scifi',
    points: 2,
    tags: ['movies', 'scifi']
  },
  {
    id: 'movie_95',
    question: 'Who plays Paul Atreides in "Dune" (2021)?',
    options: ['Tom Holland', 'Timothée Chalamet', 'Zendaya', 'Austin Butler'],
    correctAnswer: 1,
    explanation: 'Timothée Chalamet plays Paul',
    difficulty: 'casual',
    category: 'scifi',
    points: 1,
    tags: ['movies', 'scifi', 'actors']
  },

  // ============================================================================
  // ANIMATION (96-120)
  // ============================================================================
  {
    id: 'movie_96',
    question: 'What year was "Toy Story" released?',
    options: ['1993', '1995', '1997', '1999'],
    correctAnswer: 1,
    explanation: 'Toy Story was released in 1995',
    difficulty: 'casual',
    category: 'animation',
    points: 1,
    tags: ['movies', 'animation']
  },
  {
    id: 'movie_97',
    question: 'What studio made "Toy Story"?',
    options: ['DreamWorks', 'Pixar', 'Disney', 'Blue Sky'],
    correctAnswer: 1,
    explanation: 'Pixar made Toy Story',
    difficulty: 'casual',
    category: 'animation',
    points: 1,
    tags: ['movies', 'animation']
  },
  {
    id: 'movie_98',
    question: 'Who voices Woody in "Toy Story"?',
    options: ['Tim Allen', 'Tom Hanks', 'Billy Crystal', 'John Goodman'],
    correctAnswer: 1,
    explanation: 'Tom Hanks voices Woody',
    difficulty: 'casual',
    category: 'animation',
    points: 1,
    tags: ['movies', 'animation', 'actors']
  },
  {
    id: 'movie_99',
    question: 'Who voices Buzz Lightyear in "Toy Story"?',
    options: ['Tom Hanks', 'Tim Allen', 'Chris Evans', 'Billy Crystal'],
    correctAnswer: 1,
    explanation: 'Tim Allen voices Buzz',
    difficulty: 'casual',
    category: 'animation',
    points: 1,
    tags: ['movies', 'animation', 'actors']
  },
  {
    id: 'movie_100',
    question: 'What type of fish is Nemo?',
    options: ['Blue Tang', 'Clownfish', 'Goldfish', 'Angelfish'],
    correctAnswer: 1,
    explanation: 'Nemo is a clownfish',
    difficulty: 'casual',
    category: 'animation',
    points: 1,
    tags: ['movies', 'animation']
  },

  {
    id: 'movie_101',
    question: 'Who voices Dory in "Finding Nemo"?',
    options: ['Tina Fey', 'Ellen DeGeneres', 'Amy Poehler', 'Kristen Wiig'],
    correctAnswer: 1,
    explanation: 'Ellen DeGeneres voices Dory',
    difficulty: 'casual',
    category: 'animation',
    points: 1,
    tags: ['movies', 'animation', 'actors']
  },
  {
    id: 'movie_102',
    question: 'What year was "The Lion King" (original) released?',
    options: ['1992', '1994', '1996', '1998'],
    correctAnswer: 1,
    explanation: 'The Lion King was released in 1994',
    difficulty: 'casual',
    category: 'animation',
    points: 1,
    tags: ['movies', 'animation']
  },
  {
    id: 'movie_103',
    question: 'Who voices Mufasa in "The Lion King"?',
    options: ['Matthew Broderick', 'James Earl Jones', 'Jeremy Irons', 'Rowan Atkinson'],
    correctAnswer: 1,
    explanation: 'James Earl Jones voices Mufasa',
    difficulty: 'moderate',
    category: 'animation',
    points: 2,
    tags: ['movies', 'animation', 'actors']
  },
  {
    id: 'movie_104',
    question: 'What year was "Shrek" released?',
    options: ['1999', '2001', '2003', '2005'],
    correctAnswer: 1,
    explanation: 'Shrek was released in 2001',
    difficulty: 'casual',
    category: 'animation',
    points: 1,
    tags: ['movies', 'animation']
  },
  {
    id: 'movie_105',
    question: 'Who voices Shrek?',
    options: ['Eddie Murphy', 'Mike Myers', 'Cameron Diaz', 'John Lithgow'],
    correctAnswer: 1,
    explanation: 'Mike Myers voices Shrek',
    difficulty: 'casual',
    category: 'animation',
    points: 1,
    tags: ['movies', 'animation', 'actors']
  },
  {
    id: 'movie_106',
    question: 'Who voices Donkey in "Shrek"?',
    options: ['Mike Myers', 'Eddie Murphy', 'Antonio Banderas', 'John Lithgow'],
    correctAnswer: 1,
    explanation: 'Eddie Murphy voices Donkey',
    difficulty: 'casual',
    category: 'animation',
    points: 1,
    tags: ['movies', 'animation', 'actors']
  },
  {
    id: 'movie_107',
    question: 'What studio made "Shrek"?',
    options: ['Pixar', 'DreamWorks', 'Disney', 'Illumination'],
    correctAnswer: 1,
    explanation: 'DreamWorks made Shrek',
    difficulty: 'casual',
    category: 'animation',
    points: 1,
    tags: ['movies', 'animation']
  },
  {
    id: 'movie_108',
    question: 'What year was "Frozen" released?',
    options: ['2011', '2013', '2015', '2017'],
    correctAnswer: 1,
    explanation: 'Frozen was released in 2013',
    difficulty: 'casual',
    category: 'animation',
    points: 1,
    tags: ['movies', 'animation']
  },
  {
    id: 'movie_109',
    question: 'What is the famous song from "Frozen"?',
    options: ['Let It Be', 'Let It Go', 'Let It Snow', 'Let It Shine'],
    correctAnswer: 1,
    explanation: 'Let It Go',
    difficulty: 'casual',
    category: 'animation',
    points: 1,
    tags: ['movies', 'animation']
  },
  {
    id: 'movie_110',
    question: 'Who voices Elsa in "Frozen"?',
    options: ['Kristen Bell', 'Idina Menzel', 'Mandy Moore', 'Amy Adams'],
    correctAnswer: 1,
    explanation: 'Idina Menzel voices Elsa',
    difficulty: 'moderate',
    category: 'animation',
    points: 2,
    tags: ['movies', 'animation', 'actors']
  },

  // ============================================================================
  // MCU / MARVEL (111-140)
  // ============================================================================
  {
    id: 'movie_111',
    question: 'What was the first MCU film?',
    options: ['The Incredible Hulk', 'Iron Man', 'Thor', 'Captain America'],
    correctAnswer: 1,
    explanation: 'Iron Man (2008) was the first MCU film',
    difficulty: 'casual',
    category: 'mcu',
    points: 1,
    tags: ['movies', 'mcu']
  },
  {
    id: 'movie_112',
    question: 'Who plays Captain America?',
    options: ['Chris Hemsworth', 'Chris Evans', 'Chris Pratt', 'Robert Downey Jr.'],
    correctAnswer: 1,
    explanation: 'Chris Evans plays Captain America',
    difficulty: 'casual',
    category: 'mcu',
    points: 1,
    tags: ['movies', 'mcu', 'actors']
  },
  {
    id: 'movie_113',
    question: 'Who plays Thor?',
    options: ['Chris Evans', 'Chris Hemsworth', 'Chris Pratt', 'Tom Hiddleston'],
    correctAnswer: 1,
    explanation: 'Chris Hemsworth plays Thor',
    difficulty: 'casual',
    category: 'mcu',
    points: 1,
    tags: ['movies', 'mcu', 'actors']
  },
  {
    id: 'movie_114',
    question: 'What is the name of Thor\'s hammer?',
    options: ['Stormbreaker', 'Mjolnir', 'Gungnir', 'Hofund'],
    correctAnswer: 1,
    explanation: 'Mjolnir is Thor\'s hammer',
    difficulty: 'casual',
    category: 'mcu',
    points: 1,
    tags: ['movies', 'mcu']
  },
  {
    id: 'movie_115',
    question: 'What is the name of Thor\'s brother?',
    options: ['Odin', 'Loki', 'Heimdall', 'Baldur'],
    correctAnswer: 1,
    explanation: 'Loki is Thor\'s brother',
    difficulty: 'casual',
    category: 'mcu',
    points: 1,
    tags: ['movies', 'mcu']
  },
  {
    id: 'movie_116',
    question: 'Who plays Loki?',
    options: ['Chris Hemsworth', 'Tom Hiddleston', 'Idris Elba', 'Anthony Hopkins'],
    correctAnswer: 1,
    explanation: 'Tom Hiddleston plays Loki',
    difficulty: 'casual',
    category: 'mcu',
    points: 1,
    tags: ['movies', 'mcu', 'actors']
  },
  {
    id: 'movie_117',
    question: 'What year was "The Avengers" released?',
    options: ['2010', '2012', '2014', '2016'],
    correctAnswer: 1,
    explanation: 'The Avengers was released in 2012',
    difficulty: 'casual',
    category: 'mcu',
    points: 1,
    tags: ['movies', 'mcu']
  },
  {
    id: 'movie_118',
    question: 'Who is the main villain in "Avengers: Infinity War"?',
    options: ['Ultron', 'Loki', 'Thanos', 'Hela'],
    correctAnswer: 2,
    explanation: 'Thanos is the main villain',
    difficulty: 'casual',
    category: 'mcu',
    points: 1,
    tags: ['movies', 'mcu']
  },
  {
    id: 'movie_119',
    question: 'Who plays Thanos?',
    options: ['James Brolin', 'Josh Brolin', 'Jeff Bridges', 'Michael Douglas'],
    correctAnswer: 1,
    explanation: 'Josh Brolin plays Thanos',
    difficulty: 'moderate',
    category: 'mcu',
    points: 2,
    tags: ['movies', 'mcu', 'actors']
  },
  {
    id: 'movie_120',
    question: 'How many Infinity Stones are there?',
    options: ['4', '5', '6', '7'],
    correctAnswer: 2,
    explanation: 'There are 6 Infinity Stones',
    difficulty: 'casual',
    category: 'mcu',
    points: 1,
    tags: ['movies', 'mcu']
  },

  {
    id: 'movie_121',
    question: 'Who plays Spider-Man in the MCU?',
    options: ['Tobey Maguire', 'Andrew Garfield', 'Tom Holland', 'Miles Morales'],
    correctAnswer: 2,
    explanation: 'Tom Holland plays Spider-Man in the MCU',
    difficulty: 'casual',
    category: 'mcu',
    points: 1,
    tags: ['movies', 'mcu', 'actors']
  },
  {
    id: 'movie_122',
    question: 'Who plays Doctor Strange?',
    options: ['Robert Downey Jr.', 'Benedict Cumberbatch', 'Tom Hiddleston', 'Paul Bettany'],
    correctAnswer: 1,
    explanation: 'Benedict Cumberbatch plays Doctor Strange',
    difficulty: 'casual',
    category: 'mcu',
    points: 1,
    tags: ['movies', 'mcu', 'actors']
  },
  {
    id: 'movie_123',
    question: 'Who plays Black Panther?',
    options: ['Michael B. Jordan', 'Chadwick Boseman', 'Daniel Kaluuya', 'Letitia Wright'],
    correctAnswer: 1,
    explanation: 'Chadwick Boseman played Black Panther',
    difficulty: 'casual',
    category: 'mcu',
    points: 1,
    tags: ['movies', 'mcu', 'actors']
  },
  {
    id: 'movie_124',
    question: 'What is the name of Black Panther\'s country?',
    options: ['Genosha', 'Wakanda', 'Latveria', 'Sokovia'],
    correctAnswer: 1,
    explanation: 'Wakanda',
    difficulty: 'casual',
    category: 'mcu',
    points: 1,
    tags: ['movies', 'mcu']
  },
  {
    id: 'movie_125',
    question: 'Who plays Black Widow?',
    options: ['Gal Gadot', 'Scarlett Johansson', 'Elizabeth Olsen', 'Brie Larson'],
    correctAnswer: 1,
    explanation: 'Scarlett Johansson plays Black Widow',
    difficulty: 'casual',
    category: 'mcu',
    points: 1,
    tags: ['movies', 'mcu', 'actors']
  },
  {
    id: 'movie_126',
    question: 'Who plays the Hulk in the MCU (post-2012)?',
    options: ['Edward Norton', 'Mark Ruffalo', 'Eric Bana', 'Lou Ferrigno'],
    correctAnswer: 1,
    explanation: 'Mark Ruffalo plays the Hulk',
    difficulty: 'casual',
    category: 'mcu',
    points: 1,
    tags: ['movies', 'mcu', 'actors']
  },
  {
    id: 'movie_127',
    question: 'Who plays Star-Lord in "Guardians of the Galaxy"?',
    options: ['Chris Evans', 'Chris Hemsworth', 'Chris Pratt', 'Dave Bautista'],
    correctAnswer: 2,
    explanation: 'Chris Pratt plays Star-Lord',
    difficulty: 'casual',
    category: 'mcu',
    points: 1,
    tags: ['movies', 'mcu', 'actors']
  },
  {
    id: 'movie_128',
    question: 'What year was "Avengers: Endgame" released?',
    options: ['2017', '2018', '2019', '2020'],
    correctAnswer: 2,
    explanation: 'Endgame was released in 2019',
    difficulty: 'casual',
    category: 'mcu',
    points: 1,
    tags: ['movies', 'mcu']
  },
  {
    id: 'movie_129',
    question: 'Who directed "Avengers: Endgame"?',
    options: ['Joss Whedon', 'The Russo Brothers', 'James Gunn', 'Taika Waititi'],
    correctAnswer: 1,
    explanation: 'The Russo Brothers directed Endgame',
    difficulty: 'moderate',
    category: 'mcu',
    points: 2,
    tags: ['movies', 'mcu', 'directors']
  },
  {
    id: 'movie_130',
    question: 'Who plays Captain Marvel?',
    options: ['Gal Gadot', 'Scarlett Johansson', 'Brie Larson', 'Elizabeth Olsen'],
    correctAnswer: 2,
    explanation: 'Brie Larson plays Captain Marvel',
    difficulty: 'casual',
    category: 'mcu',
    points: 1,
    tags: ['movies', 'mcu', 'actors']
  },

  // ============================================================================
  // DC MOVIES (131-155)
  // ============================================================================
  {
    id: 'movie_131',
    question: 'Who played Superman in "Man of Steel"?',
    options: ['Brandon Routh', 'Henry Cavill', 'Tom Welling', 'Christopher Reeve'],
    correctAnswer: 1,
    explanation: 'Henry Cavill played Superman',
    difficulty: 'casual',
    category: 'dc',
    points: 1,
    tags: ['movies', 'dc', 'actors']
  },
  {
    id: 'movie_132',
    question: 'Who directed "Man of Steel"?',
    options: ['Christopher Nolan', 'Zack Snyder', 'James Wan', 'Patty Jenkins'],
    correctAnswer: 1,
    explanation: 'Zack Snyder directed Man of Steel',
    difficulty: 'moderate',
    category: 'dc',
    points: 2,
    tags: ['movies', 'dc', 'directors']
  },
  {
    id: 'movie_133',
    question: 'Who played Batman in "Batman v Superman"?',
    options: ['Christian Bale', 'Ben Affleck', 'Robert Pattinson', 'George Clooney'],
    correctAnswer: 1,
    explanation: 'Ben Affleck played Batman',
    difficulty: 'casual',
    category: 'dc',
    points: 1,
    tags: ['movies', 'dc', 'actors']
  },
  {
    id: 'movie_134',
    question: 'Who directed "Wonder Woman" (2017)?',
    options: ['Zack Snyder', 'Patty Jenkins', 'James Wan', 'David Ayer'],
    correctAnswer: 1,
    explanation: 'Patty Jenkins directed Wonder Woman',
    difficulty: 'moderate',
    category: 'dc',
    points: 2,
    tags: ['movies', 'dc', 'directors']
  },
  {
    id: 'movie_135',
    question: 'Who plays Wonder Woman?',
    options: ['Scarlett Johansson', 'Gal Gadot', 'Brie Larson', 'Margot Robbie'],
    correctAnswer: 1,
    explanation: 'Gal Gadot plays Wonder Woman',
    difficulty: 'casual',
    category: 'dc',
    points: 1,
    tags: ['movies', 'dc', 'actors']
  },
  {
    id: 'movie_136',
    question: 'Who plays Aquaman?',
    options: ['Chris Hemsworth', 'Jason Momoa', 'Dwayne Johnson', 'Henry Cavill'],
    correctAnswer: 1,
    explanation: 'Jason Momoa plays Aquaman',
    difficulty: 'casual',
    category: 'dc',
    points: 1,
    tags: ['movies', 'dc', 'actors']
  },
  {
    id: 'movie_137',
    question: 'Who plays Batman in "The Batman" (2022)?',
    options: ['Ben Affleck', 'Robert Pattinson', 'Christian Bale', 'George Clooney'],
    correctAnswer: 1,
    explanation: 'Robert Pattinson plays Batman',
    difficulty: 'casual',
    category: 'dc',
    points: 1,
    tags: ['movies', 'dc', 'actors']
  },
  {
    id: 'movie_138',
    question: 'Who played Catwoman in "The Batman" (2022)?',
    options: ['Michelle Pfeiffer', 'Anne Hathaway', 'Halle Berry', 'Zoë Kravitz'],
    correctAnswer: 3,
    explanation: 'Zoë Kravitz played Catwoman',
    difficulty: 'casual',
    category: 'dc',
    points: 1,
    tags: ['movies', 'dc', 'actors']
  },
  {
    id: 'movie_139',
    question: 'What year was "Joker" released?',
    options: ['2017', '2019', '2021', '2023'],
    correctAnswer: 1,
    explanation: 'Joker was released in 2019',
    difficulty: 'casual',
    category: 'dc',
    points: 1,
    tags: ['movies', 'dc']
  },
  {
    id: 'movie_140',
    question: 'Who plays Harley Quinn in "Suicide Squad"?',
    options: ['Gal Gadot', 'Margot Robbie', 'Cara Delevingne', 'Karen Fukuhara'],
    correctAnswer: 1,
    explanation: 'Margot Robbie plays Harley Quinn',
    difficulty: 'casual',
    category: 'dc',
    points: 1,
    tags: ['movies', 'dc', 'actors']
  },


  // ============================================================================
  // COMEDY (141-165)
  // ============================================================================
  {
    id: 'movie_141',
    question: 'What year was "The Hangover" released?',
    options: ['2007', '2009', '2011', '2013'],
    correctAnswer: 1,
    explanation: 'The Hangover was released in 2009',
    difficulty: 'moderate',
    category: 'comedy',
    points: 2,
    tags: ['movies', 'comedy']
  },
  {
    id: 'movie_142',
    question: 'What city is "The Hangover" set in?',
    options: ['Atlantic City', 'Las Vegas', 'Miami', 'Los Angeles'],
    correctAnswer: 1,
    explanation: 'Las Vegas',
    difficulty: 'casual',
    category: 'comedy',
    points: 1,
    tags: ['movies', 'comedy']
  },
  {
    id: 'movie_143',
    question: 'Who plays Ron Burgundy in "Anchorman"?',
    options: ['Steve Carell', 'Will Ferrell', 'Paul Rudd', 'David Koechner'],
    correctAnswer: 1,
    explanation: 'Will Ferrell plays Ron Burgundy',
    difficulty: 'casual',
    category: 'comedy',
    points: 1,
    tags: ['movies', 'comedy', 'actors']
  },
  {
    id: 'movie_144',
    question: 'Who stars in "Step Brothers" with Will Ferrell?',
    options: ['Adam McKay', 'John C. Reilly', 'Mark Wahlberg', 'Steve Carell'],
    correctAnswer: 1,
    explanation: 'John C. Reilly',
    difficulty: 'casual',
    category: 'comedy',
    points: 1,
    tags: ['movies', 'comedy', 'actors']
  },
  {
    id: 'movie_145',
    question: 'Who stars in "The 40-Year-Old Virgin"?',
    options: ['Will Ferrell', 'Steve Carell', 'Seth Rogen', 'Paul Rudd'],
    correctAnswer: 1,
    explanation: 'Steve Carell',
    difficulty: 'casual',
    category: 'comedy',
    points: 1,
    tags: ['movies', 'comedy', 'actors']
  },
  {
    id: 'movie_146',
    question: 'Who stars in "Dumb and Dumber"?',
    options: ['Adam Sandler & Chris Farley', 'Jim Carrey & Jeff Daniels', 'Ben Stiller & Owen Wilson', 'Will Ferrell & John C. Reilly'],
    correctAnswer: 1,
    explanation: 'Jim Carrey and Jeff Daniels',
    difficulty: 'casual',
    category: 'comedy',
    points: 1,
    tags: ['movies', 'comedy', 'actors']
  },
  {
    id: 'movie_147',
    question: 'Who plays Ace Ventura?',
    options: ['Adam Sandler', 'Jim Carrey', 'Chris Farley', 'Mike Myers'],
    correctAnswer: 1,
    explanation: 'Jim Carrey plays Ace Ventura',
    difficulty: 'casual',
    category: 'comedy',
    points: 1,
    tags: ['movies', 'comedy', 'actors']
  },
  {
    id: 'movie_148',
    question: 'Who plays Stanley Ipkiss in "The Mask"?',
    options: ['Adam Sandler', 'Jim Carrey', 'Chris Farley', 'Mike Myers'],
    correctAnswer: 1,
    explanation: 'Jim Carrey',
    difficulty: 'casual',
    category: 'comedy',
    points: 1,
    tags: ['movies', 'comedy', 'actors']
  },
  {
    id: 'movie_149',
    question: 'Who directed "Superbad"?',
    options: ['Judd Apatow', 'Greg Mottola', 'Seth Rogen', 'Evan Goldberg'],
    correctAnswer: 1,
    explanation: 'Greg Mottola directed Superbad',
    difficulty: 'expert',
    category: 'comedy',
    points: 3,
    tags: ['movies', 'comedy', 'directors']
  },
  {
    id: 'movie_150',
    question: 'Who stars in "Bridesmaids"?',
    options: ['Amy Schumer', 'Kristen Wiig', 'Tina Fey', 'Amy Poehler'],
    correctAnswer: 1,
    explanation: 'Kristen Wiig',
    difficulty: 'moderate',
    category: 'comedy',
    points: 2,
    tags: ['movies', 'comedy', 'actors']
  },

  // ============================================================================
  // ACTION (151-175)
  // ============================================================================
  {
    id: 'movie_151',
    question: 'What year was "Die Hard" released?',
    options: ['1986', '1988', '1990', '1992'],
    correctAnswer: 1,
    explanation: 'Die Hard was released in 1988',
    difficulty: 'moderate',
    category: 'action',
    points: 2,
    tags: ['movies', 'action']
  },
  {
    id: 'movie_152',
    question: 'Who plays John McClane in "Die Hard"?',
    options: ['Arnold Schwarzenegger', 'Bruce Willis', 'Sylvester Stallone', 'Mel Gibson'],
    correctAnswer: 1,
    explanation: 'Bruce Willis plays John McClane',
    difficulty: 'casual',
    category: 'action',
    points: 1,
    tags: ['movies', 'action', 'actors']
  },
  {
    id: 'movie_153',
    question: 'What building is "Die Hard" set in?',
    options: ['Empire State Building', 'Nakatomi Plaza', 'Willis Tower', 'World Trade Center'],
    correctAnswer: 1,
    explanation: 'Nakatomi Plaza',
    difficulty: 'moderate',
    category: 'action',
    points: 2,
    tags: ['movies', 'action']
  },
  {
    id: 'movie_154',
    question: 'Who stars in "Predator"?',
    options: ['Sylvester Stallone', 'Arnold Schwarzenegger', 'Bruce Willis', 'Jean-Claude Van Damme'],
    correctAnswer: 1,
    explanation: 'Arnold Schwarzenegger',
    difficulty: 'casual',
    category: 'action',
    points: 1,
    tags: ['movies', 'action', 'actors']
  },
  {
    id: 'movie_155',
    question: 'Who plays John Wick?',
    options: ['Liam Neeson', 'Keanu Reeves', 'Jason Statham', 'Tom Cruise'],
    correctAnswer: 1,
    explanation: 'Keanu Reeves plays John Wick',
    difficulty: 'casual',
    category: 'action',
    points: 1,
    tags: ['movies', 'action', 'actors']
  },
  {
    id: 'movie_156',
    question: 'What year was the first "John Wick" released?',
    options: ['2012', '2014', '2016', '2018'],
    correctAnswer: 1,
    explanation: 'John Wick was released in 2014',
    difficulty: 'moderate',
    category: 'action',
    points: 2,
    tags: ['movies', 'action']
  },
  {
    id: 'movie_157',
    question: 'Who played Mad Max in the original films?',
    options: ['Tom Hardy', 'Mel Gibson', 'Russell Crowe', 'Hugh Jackman'],
    correctAnswer: 1,
    explanation: 'Mel Gibson played Mad Max',
    difficulty: 'moderate',
    category: 'action',
    points: 2,
    tags: ['movies', 'action', 'actors']
  },
  {
    id: 'movie_158',
    question: 'Who played Mad Max in "Fury Road"?',
    options: ['Mel Gibson', 'Tom Hardy', 'Russell Crowe', 'Hugh Jackman'],
    correctAnswer: 1,
    explanation: 'Tom Hardy played Mad Max',
    difficulty: 'casual',
    category: 'action',
    points: 1,
    tags: ['movies', 'action', 'actors']
  },
  {
    id: 'movie_159',
    question: 'Who plays Ethan Hunt in "Mission: Impossible"?',
    options: ['Matt Damon', 'Tom Cruise', 'Brad Pitt', 'George Clooney'],
    correctAnswer: 1,
    explanation: 'Tom Cruise plays Ethan Hunt',
    difficulty: 'casual',
    category: 'action',
    points: 1,
    tags: ['movies', 'action', 'actors']
  },
  {
    id: 'movie_160',
    question: 'Who plays Dominic Toretto in "Fast & Furious"?',
    options: ['Paul Walker', 'Vin Diesel', 'Dwayne Johnson', 'Jason Statham'],
    correctAnswer: 1,
    explanation: 'Vin Diesel plays Dom Toretto',
    difficulty: 'casual',
    category: 'action',
    points: 1,
    tags: ['movies', 'action', 'actors']
  },
