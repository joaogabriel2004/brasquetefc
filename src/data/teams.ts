export type Player = {
  id: string;
  name: string;
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  attack: number;
  defense: number;
  energy: number;
  teamId: string;
};

export type Team = {
  id: string;
  name: string;
  players: Player[];
};

export const teams: Team[] = [
  {
    id: 'gsw',
    name: 'Golden State Warriors',
    players: [
      { id: 'stephen_curry', name: 'Stephen Curry', teamId:'gsw', position: 'PG', attack: 90, defense: 70, energy: 100 },
      { id: 'jimmy_butler', name: 'Jimmy Butler', teamId:'gsw', position: 'SF', attack: 85, defense: 75, energy: 100 },
      { id: 'draymond_green', name: 'Draymond Green', teamId:'gsw', position: 'PF', attack: 70, defense: 85, energy: 100 },
      { id: 'andrew_wiggins', name: 'Andrew Wiggins', teamId:'gsw', position: 'SF', attack: 75, defense: 72, energy: 100 },
      { id: 'buddy_hield', name: 'Buddy Hield', teamId:'gsw', position: 'SG', attack: 78, defense: 70, energy: 100 },
      { id: 'trayce_jackson_davis', name: 'Trayce Jackson-Davis', teamId:'gsw', position: 'PF', attack: 72, defense: 74, energy: 100 },
      { id: 'chris_paul', name: 'Chris Paul', teamId:'gsw', position: 'PG', attack: 75, defense: 70, energy: 100 },
      { id: 'jonathan_kuminga', name: 'Jonathan Kuminga', teamId:'gsw', position: 'SF', attack: 77, defense: 72, energy: 100 },
      { id: 'brandin_podziemski', name: 'Brandin Podziemski', teamId:'gsw', position: 'SG', attack: 70, defense: 70, energy: 100 },
      { id: 'moses_moody', name: 'Moses Moody', teamId:'gsw', position: 'SG', attack: 68, defense: 68, energy: 100 },
    ]
  },
  {
    id: 'bos',
    name: 'Boston Celtics',
    players: [
      { id: 'jayson_tatum', name: 'Jayson Tatum', teamId:'bos', position: 'SF', attack: 92, defense: 80, energy: 100 },
      { id: 'jaylen_brown', name: 'Jaylen Brown', teamId:'bos', position: 'SG', attack: 88, defense: 78, energy: 100 },
      { id: 'kristaps_porzingis', name: 'Kristaps Porzingis', teamId:'bos', position: 'C', attack: 85, defense: 82, energy: 100 },
      { id: 'derrick_white', name: 'Derrick White', teamId:'bos', position: 'PG', attack: 80, defense: 75, energy: 100 },
      { id: 'luka_garza', name: 'Luka Garza', teamId:'bos', position: 'C', attack: 75, defense: 72, energy: 100 },
      { id: 'chris_boucher', name: 'Chris Boucher', teamId:'bos', position: 'PF', attack: 72, defense: 74, energy: 100 },
      { id: 'payton_pritchard', name: 'Payton Pritchard', teamId:'bos', position: 'PG', attack: 70, defense: 68, energy: 100 },
      { id: 'anfernee_simons', name: 'Anfernee Simons', teamId:'bos', position: 'SG', attack: 76, defense: 70, energy: 100 },
      { id: 'josh_minott', name: 'Josh Minott', teamId:'bos', position: 'SF', attack: 65, defense: 65, energy: 100 },
      { id: 'quenton_post', name: 'Quenton Post', teamId:'bos', position: 'C', attack: 60, defense: 65, energy: 100 },
    ]
  }
];
