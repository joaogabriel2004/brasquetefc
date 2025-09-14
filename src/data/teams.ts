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
  },
  {
    id: 'lal',
    name: 'Los Angeles Lakers',
    players: [
      { id: 'lebron_james', name: 'LeBron James', teamId:'lal', position: 'SF', attack: 92, defense: 80, energy: 100 },
      { id: 'anthony_davis', name: 'Anthony Davis', teamId:'lal', position: 'PF', attack: 88, defense: 90, energy: 100 },
      { id: 'dangelo_russell', name: 'D\'Angelo Russell', teamId:'lal', position: 'PG', attack: 82, defense: 70, energy: 100 },
      { id: 'austin_reaves', name: 'Austin Reaves', teamId:'lal', position: 'SG', attack: 80, defense: 72, energy: 100 },
      { id: 'rui_hachimura', name: 'Rui Hachimura', teamId:'lal', position: 'SF', attack: 77, defense: 72, energy: 100 },
      { id: 'jarred_vanderbilt', name: 'Jarred Vanderbilt', teamId:'lal', position: 'PF', attack: 70, defense: 78, energy: 100 },
      { id: 'gabe_vincent', name: 'Gabe Vincent', teamId:'lal', position: 'PG', attack: 72, defense: 70, energy: 100 },
      { id: 'max_christie', name: 'Max Christie', teamId:'lal', position: 'SG', attack: 68, defense: 65, energy: 100 },
      { id: 'jaxon_hayes', name: 'Jaxson Hayes', teamId:'lal', position: 'C', attack: 70, defense: 72, energy: 100 },
      { id: 'cam_reddish', name: 'Cam Reddish', teamId:'lal', position: 'SF', attack: 68, defense: 68, energy: 100 },
    ]
  },
  {
    id: 'mia',
    name: 'Miami Heat',
    players: [
      { id: 'jimmy_butler', name: 'Jimmy Butler', teamId:'mia', position: 'SF', attack: 87, defense: 82, energy: 100 },
      { id: 'bam_adebayo', name: 'Bam Adebayo', teamId:'mia', position: 'C', attack: 83, defense: 86, energy: 100 },
      { id: 'tyler_herro', name: 'Tyler Herro', teamId:'mia', position: 'SG', attack: 84, defense: 70, energy: 100 },
      { id: 'kyle_lowry', name: 'Kyle Lowry', teamId:'mia', position: 'PG', attack: 75, defense: 75, energy: 100 },
      { id: 'caleb_martin', name: 'Caleb Martin', teamId:'mia', position: 'SF', attack: 75, defense: 72, energy: 100 },
      { id: 'duncan_robinson', name: 'Duncan Robinson', teamId:'mia', position: 'SG', attack: 78, defense: 65, energy: 100 },
      { id: 'jaime_jaquez', name: 'Jaime Jaquez Jr.', teamId:'mia', position: 'SF', attack: 74, defense: 70, energy: 100 },
      { id: 'thomas_bryant', name: 'Thomas Bryant', teamId:'mia', position: 'C', attack: 72, defense: 70, energy: 100 },
      { id: 'josh_richardson', name: 'Josh Richardson', teamId:'mia', position: 'SG', attack: 72, defense: 72, energy: 100 },
      { id: 'nikola_jovic', name: 'Nikola Jovic', teamId:'mia', position: 'PF', attack: 70, defense: 68, energy: 100 },
    ]
  },
  {
    id: 'mil',
    name: 'Milwaukee Bucks',
    players: [
      { id: 'giannis_antetokounmpo', name: 'Giannis Antetokounmpo', teamId:'mil', position: 'PF', attack: 94, defense: 90, energy: 100 },
      { id: 'damian_lillard', name: 'Damian Lillard', teamId:'mil', position: 'PG', attack: 92, defense: 72, energy: 100 },
      { id: 'khris_middleton', name: 'Khris Middleton', teamId:'mil', position: 'SF', attack: 84, defense: 75, energy: 100 },
      { id: 'brook_lopez', name: 'Brook Lopez', teamId:'mil', position: 'C', attack: 80, defense: 85, energy: 100 },
      { id: 'bobby_portis', name: 'Bobby Portis', teamId:'mil', position: 'PF', attack: 78, defense: 75, energy: 100 },
      { id: 'pat_connaughton', name: 'Pat Connaughton', teamId:'mil', position: 'SG', attack: 72, defense: 70, energy: 100 },
      { id: 'malik_beasley', name: 'Malik Beasley', teamId:'mil', position: 'SG', attack: 75, defense: 68, energy: 100 },
      { id: 'jayson_boatwright', name: 'MarJon Beauchamp', teamId:'mil', position: 'SF', attack: 70, defense: 68, energy: 100 },
      { id: 'aj_green', name: 'AJ Green', teamId:'mil', position: 'SG', attack: 65, defense: 65, energy: 100 },
      { id: 'thanasis_antetokounmpo', name: 'Thanasis Antetokounmpo', teamId:'mil', position: 'SF', attack: 60, defense: 65, energy: 100 },
    ]
  },
  {
    id: 'phi',
    name: 'Philadelphia 76ers',
    players: [
      { id: 'joel_embiid', name: 'Joel Embiid', teamId:'phi', position: 'C', attack: 95, defense: 88, energy: 100 },
      { id: 'tyrese_maxey', name: 'Tyrese Maxey', teamId:'phi', position: 'PG', attack: 85, defense: 72, energy: 100 },
      { id: 'tobias_harris', name: 'Tobias Harris', teamId:'phi', position: 'SF', attack: 80, defense: 75, energy: 100 },
      { id: 'patrick_beverley', name: 'Patrick Beverley', teamId:'phi', position: 'PG', attack: 70, defense: 78, energy: 100 },
      { id: 'paul_reed', name: 'Paul Reed', teamId:'phi', position: 'PF', attack: 72, defense: 75, energy: 100 },
      { id: 'kelly_oubre', name: 'Kelly Oubre Jr.', teamId:'phi', position: 'SF', attack: 78, defense: 70, energy: 100 },
      { id: 'danuel_house', name: 'Danuel House Jr.', teamId:'phi', position: 'SF', attack: 70, defense: 70, energy: 100 },
      { id: 'deanthony_melton', name: 'De\'Anthony Melton', teamId:'phi', position: 'SG', attack: 76, defense: 75, energy: 100 },
      { id: 'mo_bamba', name: 'Mo Bamba', teamId:'phi', position: 'C', attack: 70, defense: 70, energy: 100 },
      { id: 'furkan_korkmaz', name: 'Furkan Korkmaz', teamId:'phi', position: 'SG', attack: 68, defense: 65, energy: 100 },
    ]
  },
  {
    id: 'den',
    name: 'Denver Nuggets',
    players: [
      { id: 'nikola_jokic', name: 'Nikola Jokic', teamId:'den', position: 'C', attack: 95, defense: 85, energy: 100 },
      { id: 'jamal_murray', name: 'Jamal Murray', teamId:'den', position: 'PG', attack: 88, defense: 75, energy: 100 },
      { id: 'michael_porter', name: 'Michael Porter Jr.', teamId:'den', position: 'SF', attack: 82, defense: 72, energy: 100 },
      { id: 'aaron_gordon', name: 'Aaron Gordon', teamId:'den', position: 'PF', attack: 80, defense: 78, energy: 100 },
      { id: 'kentavious_caldwell_pope', name: 'Kentavious Caldwell-Pope', teamId:'den', position: 'SG', attack: 78, defense: 75, energy: 100 },
      { id: 'christian_braun', name: 'Christian Braun', teamId:'den', position: 'SG', attack: 70, defense: 72, energy: 100 },
      { id: 'justin_holiday', name: 'Justin Holiday', teamId:'den', position: 'SF', attack: 68, defense: 70, energy: 100 },
      { id: 'peyton_watson', name: 'Peyton Watson', teamId:'den', position: 'PF', attack: 68, defense: 70, energy: 100 },
      { id: 'zeke_nnaji', name: 'Zeke Nnaji', teamId:'den', position: 'C', attack: 70, defense: 72, energy: 100 },
      { id: 'reggie_jackson', name: 'Reggie Jackson', teamId:'den', position: 'PG', attack: 72, defense: 68, energy: 100 },
    ]
  }
];
