export type Player = {
  id: string;
  name: string;
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  attack: number;
  defense: number;
  energy: number;
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
      { id: 'stephen_curry', name: 'Stephen Curry', position: 'PG', attack: 90, defense: 70, energy: 95 },
      { id: 'jimmy_butler', name: 'Jimmy Butler', position: 'SF', attack: 85, defense: 75, energy: 90 },
      { id: 'draymond_green', name: 'Draymond Green', position: 'PF', attack: 70, defense: 85, energy: 90 },
      { id: 'andrew_wiggins', name: 'Andrew Wiggins', position: 'SF', attack: 75, defense: 72, energy: 92 },
      { id: 'buddy_hield', name: 'Buddy Hield', position: 'SG', attack: 78, defense: 70, energy: 88 },
      { id: 'trayce_jackson_davis', name: 'Trayce Jackson-Davis', position: 'PF', attack: 72, defense: 74, energy: 85 },
      { id: 'chris_paul', name: 'Chris Paul', position: 'PG', attack: 75, defense: 70, energy: 88 },
      { id: 'jonathan_kuminga', name: 'Jonathan Kuminga', position: 'SF', attack: 77, defense: 72, energy: 90 },
      { id: 'brandin_podziemski', name: 'Brandin Podziemski', position: 'SG', attack: 70, defense: 70, energy: 87 },
      { id: 'moses_moody', name: 'Moses Moody', position: 'SG', attack: 68, defense: 68, energy: 85 },
    ]
  },
  {
    id: 'bos',
    name: 'Boston Celtics',
    players: [
      { id: 'jayson_tatum', name: 'Jayson Tatum', position: 'SF', attack: 92, defense: 80, energy: 95 },
      { id: 'jaylen_brown', name: 'Jaylen Brown', position: 'SG', attack: 88, defense: 78, energy: 92 },
      { id: 'kristaps_porzingis', name: 'Kristaps Porzingis', position: 'C', attack: 85, defense: 82, energy: 90 },
      { id: 'derrick_white', name: 'Derrick White', position: 'PG', attack: 80, defense: 75, energy: 90 },
      { id: 'luka_garza', name: 'Luka Garza', position: 'C', attack: 75, defense: 72, energy: 88 },
      { id: 'chris_boucher', name: 'Chris Boucher', position: 'PF', attack: 72, defense: 74, energy: 87 },
      { id: 'payton_pritchard', name: 'Payton Pritchard', position: 'PG', attack: 70, defense: 68, energy: 90 },
      { id: 'anfernee_simons', name: 'Anfernee Simons', position: 'SG', attack: 76, defense: 70, energy: 88 },
      { id: 'josh_minott', name: 'Josh Minott', position: 'SF', attack: 65, defense: 65, energy: 85 },
      { id: 'quenton_post', name: 'Quenton Post', position: 'C', attack: 60, defense: 65, energy: 85 },
    ]
  }
];
