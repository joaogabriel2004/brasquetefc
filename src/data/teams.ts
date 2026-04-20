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

export const teamsReal: Team[] = [
  {
    id: 'gsw',
    name: 'Golden State Warriors',
    players: [
      { id: 'stephen_curry', name: 'Stephen Curry', teamId:'gsw', position: 'PG', attack: 93, defense: 72, energy: 100 },
      { id: 'klay_thompson', name: 'Klay Thompson', teamId:'gsw', position: 'SG', attack: 86, defense: 74, energy: 100 },
      { id: 'draymond_green', name: 'Draymond Green', teamId:'gsw', position: 'PF', attack: 72, defense: 88, energy: 100 },
      { id: 'andrew_wiggins', name: 'Andrew Wiggins', teamId:'gsw', position: 'SF', attack: 78, defense: 75, energy: 100 },
      { id: 'jonathan_kuminga', name: 'Jonathan Kuminga', teamId:'gsw', position: 'SF', attack: 76, defense: 72, energy: 100 },
      { id: 'chris_paul', name: 'Chris Paul', teamId:'gsw', position: 'PG', attack: 82, defense: 70, energy: 100 },
      { id: 'brandin_podziemski', name: 'Brandin Podziemski', teamId:'gsw', position: 'SG', attack: 72, defense: 69, energy: 100 },
      { id: 'trayce_jackson_davis', name: 'Trayce Jackson-Davis', teamId:'gsw', position: 'PF', attack: 70, defense: 74, energy: 100 },
      { id: 'moses_moody', name: 'Moses Moody', teamId:'gsw', position: 'SG', attack: 69, defense: 68, energy: 100 },
      { id: 'patrick_baldwin', name: 'Patrick Baldwin Jr.', teamId:'gsw', position: 'SF', attack: 66, defense: 65, energy: 100 },
    ]
  },
  {
    id: 'bos',
    name: 'Boston Celtics',
    players: [
      { id: 'jayson_tatum', name: 'Jayson Tatum', teamId:'bos', position: 'SF', attack: 92, defense: 81, energy: 100 },
      { id: 'jaylen_brown', name: 'Jaylen Brown', teamId:'bos', position: 'SG', attack: 89, defense: 79, energy: 100 },
      { id: 'kristaps_porzingis', name: 'Kristaps Porzingis', teamId:'bos', position: 'C', attack: 86, defense: 82, energy: 100 },
      { id: 'derrick_white', name: 'Derrick White', teamId:'bos', position: 'PG', attack: 80, defense: 76, energy: 100 },
      { id: 'al_horford', name: 'Al Horford', teamId:'bos', position: 'PF', attack: 74, defense: 78, energy: 100 },
      { id: 'malcolm_brogdon', name: 'Malcolm Brogdon', teamId:'bos', position: 'PG', attack: 78, defense: 74, energy: 100 },
      { id: 'mario_hezonja', name: 'Mario Hezonja', teamId:'bos', position: 'SF', attack: 70, defense: 68, energy: 100 },
      { id: 'sam_hauser', name: 'Sam Hauser', teamId:'bos', position: 'SG', attack: 72, defense: 66, energy: 100 },
      { id: 'lukag_garza', name: 'Luka Garza', teamId:'bos', position: 'C', attack: 70, defense: 68, energy: 100 },
      { id: 'payton_pritchard', name: 'Payton Pritchard', teamId:'bos', position: 'PG', attack: 68, defense: 66, energy: 100 },
    ]
  },
  {
    id: 'lal',
    name: 'Los Angeles Lakers',
    players: [
      { id: 'lebron_james', name: 'LeBron James', teamId:'lal', position: 'SF', attack: 94, defense: 80, energy: 100 },
      { id: 'anthony_davis', name: 'Anthony Davis', teamId:'lal', position: 'PF', attack: 88, defense: 88, energy: 100 },
      { id: 'russell_westbrook', name: 'Russell Westbrook', teamId:'lal', position: 'PG', attack: 81, defense: 70, energy: 100 },
      { id: 'dmax', name: 'D\'Angelo Russell', teamId:'lal', position: 'PG', attack: 79, defense: 68, energy: 100 },
      { id: 'd' , name: 'Malik Beasley', teamId:'lal', position: 'SG', attack: 75, defense: 65, energy: 100 },
      { id: 'taurean_prince', name: 'Taurean Prince', teamId:'lal', position: 'SF', attack: 72, defense: 70, energy: 100 },
      { id: 'austin_reaves', name: 'Austin Reaves', teamId:'lal', position: 'SG', attack: 76, defense: 68, energy: 100 },
      { id: 'derek_williams', name: 'Derek Williams', teamId:'lal', position: 'PF', attack: 70, defense: 68, energy: 100 },
      { id: 'hoopers', name: 'Jarred Vanderbilt', teamId:'lal', position: 'PF', attack: 69, defense: 71, energy: 100 },
      { id: 'cam_reddish', name: 'Cam Reddish', teamId:'lal', position: 'SF', attack: 68, defense: 65, energy: 100 },
    ]
  },
  {
    id: 'mil',
    name: 'Milwaukee Bucks',
    players: [
      { id: 'giannis_antetokounmpo', name: 'Giannis Antetokounmpo', teamId:'mil', position: 'PF', attack: 95, defense: 87, energy: 100 },
      { id: 'khris_middleton', name: 'Khris Middleton', teamId:'mil', position: 'SF', attack: 86, defense: 76, energy: 100 },
      { id: 'donte_divincenzo', name: 'Donte DiVincenzo', teamId:'mil', position: 'SG', attack: 77, defense: 72, energy: 100 },
      { id: 'bobby_portis', name: 'Bobby Portis', teamId:'mil', position: 'C', attack: 74, defense: 72, energy: 100 },
      { id: 'jeff_teague', name: 'Jeff Teague', teamId:'mil', position: 'PG', attack: 70, defense: 65, energy: 100 },
      { id: 'pat_connaughton', name: 'Pat Connaughton', teamId:'mil', position: 'SF', attack: 71, defense: 68, energy: 100 },
      { id: 'george_hill', name: 'George Hill', teamId:'mil', position: 'PG', attack: 69, defense: 66, energy: 100 },
      { id: 'jordan_nwora', name: 'Jordan Nwora', teamId:'mil', position: 'SF', attack: 68, defense: 64, energy: 100 },
      { id: 'jeffrey', name: 'Semi Ojeleye', teamId:'mil', position: 'PF', attack: 66, defense: 65, energy: 100 },
      { id: 'rookie', name: 'Rookie Example', teamId:'mil', position: 'SG', attack: 65, defense: 64, energy: 100 },
    ]
  },
  {
    id: 'den',
    name: 'Denver Nuggets',
    players: [
      { id: 'nikola_jokic', name: 'Nikola Jokic', teamId:'den', position: 'C', attack: 96, defense: 82, energy: 100 },
      { id: 'jamal_murray', name: 'Jamal Murray', teamId:'den', position: 'PG', attack: 88, defense: 74, energy: 100 },
      { id: 'michael_porter_jr', name: 'Michael Porter Jr.', teamId:'den', position: 'SF', attack: 84, defense: 70, energy: 100 },
      { id: 'aaron_gordon', name: 'Aaron Gordon', teamId:'den', position: 'PF', attack: 80, defense: 76, energy: 100 },
      { id: 'kentavious_caldwell', name: 'Kentavious Caldwell-Pope', teamId:'den', position: 'SG', attack: 75, defense: 73, energy: 100 },
      { id: 'will_barton', name: 'Will Barton', teamId:'den', position: 'SG', attack: 74, defense: 70, energy: 100 },
      { id: 'nikola_jokic_clone', name: 'Player X', teamId:'den', position: 'C', attack: 70, defense: 68, energy: 100 },
      { id: 'young_talent', name: 'Young Talent', teamId:'den', position: 'SF', attack: 68, defense: 65, energy: 100 },
      { id: 'bench1', name: 'Bench Player 1', teamId:'den', position: 'PG', attack: 67, defense: 64, energy: 100 },
      { id: 'bench2', name: 'Bench Player 2', teamId:'den', position: 'PF', attack: 65, defense: 66, energy: 100 },
    ]
  },
  {
    id: 'mia',
    name: 'Miami Heat',
    players: [
      { id: 'jimmy_butler_mia', name: 'Jimmy Butler', teamId:'mia', position: 'SF', attack: 88, defense: 82, energy: 100 },
      { id: 'bam_adebayo', name: 'Bam Adebayo', teamId:'mia', position: 'C', attack: 83, defense: 84, energy: 100 },
      { id: 'tyler_herro', name: 'Tyler Herro', teamId:'mia', position: 'SG', attack: 79, defense: 70, energy: 100 },
      { id: 'kyle_lowry', name: 'Kyle Lowry', teamId:'mia', position: 'PG', attack: 76, defense: 72, energy: 100 },
      { id: 'caleb_martin', name: 'Caleb Martin', teamId:'mia', position: 'SF', attack: 74, defense: 72, energy: 100 },
      { id: 'max_strus', name: 'Max Strus', teamId:'mia', position: 'SG', attack: 73, defense: 68, energy: 100 },
      { id: 'hayes', name: 'Haywood Highsmith', teamId:'mia', position: 'PF', attack: 70, defense: 69, energy: 100 },
      { id: 'olsen', name: 'Omer Yurtseven', teamId:'mia', position: 'C', attack: 68, defense: 66, energy: 100 },
      { id: 'young1', name: 'Young Guard', teamId:'mia', position: 'PG', attack: 67, defense: 65, energy: 100 },
      { id: 'bench_mia', name: 'Bench Mia', teamId:'mia', position: 'SF', attack: 65, defense: 64, energy: 100 },
    ]
  },
  {
    id: 'phx',
    name: 'Phoenix Suns',
    players: [
      { id: 'kevin_durant', name: 'Kevin Durant', teamId:'phx', position: 'SF', attack: 95, defense: 80, energy: 100 },
      { id: 'devin_booker', name: 'Devin Booker', teamId:'phx', position: 'SG', attack: 91, defense: 76, energy: 100 },
      { id: 'kevin_seraphin', name: 'Player A', teamId:'phx', position: 'PF', attack: 75, defense: 70, energy: 100 },
      { id: 'jordan_goodwin', name: 'Jordan Goodwin', teamId:'phx', position: 'PG', attack: 72, defense: 68, energy: 100 },
      { id: 'cherokee', name: 'Cherokee Johnson', teamId:'phx', position: 'SG', attack: 70, defense: 67, energy: 100 },
      { id: 'tariq', name: 'Tariq Owens', teamId:'phx', position: 'PF', attack: 68, defense: 67, energy: 100 },
      { id: 'bench_phx1', name: 'Bench PHX 1', teamId:'phx', position: 'SF', attack: 67, defense: 65, energy: 100 },
      { id: 'bench_phx2', name: 'Bench PHX 2', teamId:'phx', position: 'C', attack: 66, defense: 66, energy: 100 },
      { id: 'rookie_phx', name: 'Rookie PHX', teamId:'phx', position: 'SG', attack: 65, defense: 64, energy: 100 },
      { id: 'role_player', name: 'Role Player', teamId:'phx', position: 'PF', attack: 64, defense: 63, energy: 100 },
    ]
  },
  {
    id: 'phi',
    name: 'Philadelphia 76ers',
    players: [
      { id: 'james_harden', name: 'James Harden', teamId:'phi', position: 'SG', attack: 90, defense: 70, energy: 100 },
      { id: 'joel_embiid', name: 'Joel Embiid', teamId:'phi', position: 'C', attack: 94, defense: 88, energy: 100 },
      { id: 'tyrese_maxey', name: 'Tyrese Maxey', teamId:'phi', position: 'PG', attack: 88, defense: 73, energy: 100 },
      { id: 'paul_george', name: 'Paul George', teamId:'phi', position: 'SF', attack: 86, defense: 80, energy: 100 },
      { id: 'tobias_harris', name: 'Tobias Harris', teamId:'phi', position: 'PF', attack: 78, defense: 72, energy: 100 },
      { id: 'de_antonio', name: 'Bench PF', teamId:'phi', position: 'PF', attack: 71, defense: 69, energy: 100 },
      { id: 'bench_phi1', name: 'Bench 1', teamId:'phi', position: 'SG', attack: 69, defense: 67, energy: 100 },
      { id: 'bench_phi2', name: 'Bench 2', teamId:'phi', position: 'C', attack: 67, defense: 65, energy: 100 },
      { id: 'young_phi', name: 'Young Guard PHI', teamId:'phi', position: 'PG', attack: 66, defense: 64, energy: 100 },
      { id: 'role_phi', name: 'Role PHI', teamId:'phi', position: 'SF', attack: 65, defense: 63, energy: 100 },
    ]
  },
];
