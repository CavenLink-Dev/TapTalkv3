/**
 * Large preset symbol packs for the Talk Board Symbol action.
 *
 * Packs install as one folder on the Home Board. Each folder opens a generated
 * nested board tree, so broad vocabulary can be added without crowding Home.
 * Labels stay short for AAC tiles; longer meaning lives in `speech`.
 */

export type PresetPackWordType =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'social'
  | 'interjection'
  | 'phrase';

export type PresetPackSymbol = {
  type: 'symbol';
  label: string;
  speech?: string;
  wordType?: PresetPackWordType;
  symbolId?: string;
};

export type PresetPackFolder = {
  type: 'folder';
  id: string;
  label: string;
  iconId?: string;
  children: PresetPackNode[];
};

export type PresetPackNode = PresetPackFolder | PresetPackSymbol;

export type PresetSymbolPack = {
  id: string;
  title: string;
  boardLabel: string;
  category: string;
  summary: string;
  iconId: string;
  color: string;
  children: PresetPackNode[];
};

export type PresetBoardTile = {
  id: string;
  label: string;
  kind: 'folder' | 'word' | 'action';
  color: string;
  target?: string;
  speech?: string;
  mulberrySymbolId?: string;
  mulberryName?: string;
  wordType?: string;
  isProtected?: boolean;
};

export type PresetPackStats = {
  symbols: number;
  folders: number;
  samplePaths: string[];
};

const FOLDER_COLOR = '#1DCDFF';
const SYMBOL_RED = '#FF3B30';
const SYMBOL_ORANGE = '#FF9F0A';
const SYMBOL_YELLOW = '#FFD60A';
const SYMBOL_GREEN = '#34C759';
const SYMBOL_BLUE = '#0A84FF';
const SYMBOL_PURPLE = '#BF5AF2';

const WORD_TYPE_COLOR: Record<PresetPackWordType, string> = {
  noun: SYMBOL_ORANGE,
  verb: SYMBOL_GREEN,
  adjective: SYMBOL_BLUE,
  social: SYMBOL_PURPLE,
  interjection: SYMBOL_GREEN,
  phrase: SYMBOL_RED,
};

const SYMBOL_IDS: Record<string, string> = {
  aac: 'mulberry_communication_device_m2l9ji',
  afraid: 'mulberry_afraid_man_6i29yl',
  angry: 'mulberry_angry_man_1g31prr',
  apple: 'mulberry_apple_1ogqpa9',
  baby: 'mulberry_baby_1cxo7l',
  bad: 'mulberry_bad_12s0dym',
  banana: 'mulberry_banana_rcoei',
  beach: 'mulberry_beach_drxxqc',
  bird: 'mulberry_bird_13ztxas',
  book: 'mulberry_read_book_nw97ne',
  bread: 'mulberry_bread_t6g6ux',
  brother: 'mulberry_brother_1jo99rx',
  bus: 'mulberry_bus_1abvtwt',
  car: 'mulberry_car_1m0ff95',
  carrot: 'mulberry_carrot_keil00',
  cat: 'mulberry_cat_1lz3nun',
  cheese: 'mulberry_cheese_qsgfck',
  chicken: 'mulberry_chicken_live_2os875',
  church: 'mulberry_church_1t13yb2',
  close: 'mulberry_close_l7weaw',
  communication: 'mulberry_communication_device_m2l9ji',
  computer: 'mulberry_computer_1_1aswibk',
  cow: 'mulberry_cow_1pwmwc2',
  dad: 'mulberry_dad_parent_1u2b52j',
  dance: 'mulberry_dance_rdll6b',
  doctor: 'mulberry_doctor_1a_lcuwh3',
  dog: 'mulberry_dog_1bfmoh1',
  draw: 'mulberry_draw_19hlq66',
  drink: 'mulberry_drink_16zxzpv',
  duck: 'mulberry_duck_4lgl4g',
  eat: 'mulberry_eat_18rupbi',
  egg: 'mulberry_egg_1u25ooc',
  excited: 'mulberry_excited_man_5aqbg6',
  family: 'mulberry_family_excv0f',
  fire: 'mulberry_fire_1q1gv9t',
  fish: 'mulberry_fish_1u95ovx',
  finish: 'mulberry_finish_1kq32d6',
  finished: 'mulberry_finish_1kq32d6',
  food: 'mulberry_food_atkyaz',
  good: 'mulberry_good_eluzd6',
  grandpa: 'mulberry_grandfather_1dr1fzv',
  grandma: 'mulberry_grandmother_1h16pum',
  happy: 'mulberry_happy_man_d75g78',
  heart: 'mulberry_heart_9841r7',
  help: 'mulberry_help_1g1ppr',
  hello: 'mulberry_hello_1jyrbjf',
  home: 'mulberry_house_1ice1xp',
  horse: 'mulberry_horse_c0o22y',
  hospital: 'mulberry_porter_hospital_1a_vgfxj7',
  house: 'mulberry_house_1ice1xp',
  hug: 'mulberry_hug_1dc7yxw',
  hungry: 'mulberry_hungry_sp7py',
  jump: 'mulberry_jump_apgvlo',
  juice: 'mulberry_orange_juice_vav8xi',
  look: 'mulberry_look_1r6a5uh',
  loud: 'mulberry_loud_1kbu7nf',
  medicine: 'mulberry_medicine_14fp0lp',
  milk: 'mulberry_milk_1pcjn1m',
  more: 'mulberry_more_1r3s2f0',
  mum: 'mulberry_mum_parent_36g4lb',
  open: 'mulberry_open_6n4556',
  orange: 'mulberry_orange_tfdxfd',
  pain: 'mulberry_stomach_ache_16rpjjq',
  park: 'mulberry_park_18ux2ty',
  phone: 'mulberry_telephone_mobile_npvlt1',
  pizza: 'mulberry_pizza_rdymwh',
  plane: 'mulberry_plane_1pir8pr',
  play: 'mulberry_play_juloe2',
  police: 'mulberry_police_1a_142d3y2',
  potato: 'mulberry_potato_167a7ko',
  quiet: 'mulberry_quiet_4csbx1',
  rabbit: 'mulberry_rabbit_sjorvr',
  read: 'mulberry_read_1gmx20c',
  run: 'mulberry_run_1l6fpg7',
  sad: 'mulberry_sad_man_1xt7bsy',
  school: 'mulberry_school_7v1fml',
  share: 'mulberry_share_1xz6lbn',
  sheep: 'mulberry_sheep_k1gt9e',
  shop: 'mulberry_shop_8euq19',
  sing: 'mulberry_sing_v5z66l',
  sister: 'mulberry_sister_1bahkrn',
  sit: 'mulberry_sit_1aksru8',
  sleep: 'mulberry_sleep_male_1s97unf',
  snow: 'mulberry_snow_i6crm4',
  tablet: 'mulberry_tablets_79kdo0',
  swim: 'mulberry_swim_1konnmm',
  teacher: 'mulberry_teacher_1a_6kba0a',
  thirsty: 'mulberry_thirsty_j9fv0w',
  toilet: 'mulberry_toilet_1t82u6e',
  train: 'mulberry_train_6zo4kp',
  wait: 'mulberry_wait_17bhqut',
  walk: 'mulberry_walk_usrwun',
  want: 'mulberry_want_16yheia',
  wash: 'mulberry_wash_hands_zcbt6k',
  water: 'mulberry_water_139tuvw',
  worried: 'mulberry_worried_man_fzvxd0',
  write: 'mulberry_write_17xcc0z',
};

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function oneWordLabel(value: string): string {
  const compact = value.replace(/[^A-Za-z0-9]+/g, '');
  return compact || value.split(/\s+/)[0] || value;
}

function symbolIdFor(label: string): string | undefined {
  return SYMBOL_IDS[slug(label).replace(/-/g, '')] ?? SYMBOL_IDS[label.toLowerCase()];
}

function sym(
  label: string,
  wordType: PresetPackWordType = 'noun',
  speech?: string,
  symbolId?: string,
): PresetPackSymbol {
  return {
    type: 'symbol',
    label: oneWordLabel(label),
    speech: speech ?? label.toLowerCase(),
    wordType,
    symbolId: symbolId ?? symbolIdFor(label),
  };
}

function phrase(label: string, speech: string, symbolId?: string): PresetPackSymbol {
  return sym(label, 'phrase', speech, symbolId);
}

function symbols(items: string[], wordType: PresetPackWordType = 'noun'): PresetPackSymbol[] {
  return items.map(item => sym(item, wordType));
}

function folder(
  label: string,
  children: PresetPackNode[],
  iconId?: string,
): PresetPackFolder {
  return {
    type: 'folder',
    id: slug(label),
    label,
    iconId: iconId ?? symbolIdFor(label),
    children,
  };
}

function pack(
  id: string,
  title: string,
  boardLabel: string,
  category: string,
  summary: string,
  iconId: string,
  color: string,
  children: PresetPackNode[],
): PresetSymbolPack {
  return { id, title, boardLabel, category, summary, iconId, color, children };
}

export const PRESET_SYMBOL_PACKS: PresetSymbolPack[] = [
  pack('quick-actions', 'Quick Actions', 'Quick', 'Core', 'Fast responses, needs, help, and social phrases.', 'mulberry_good_eluzd6', SYMBOL_GREEN, [
    folder('Responses', [
      ...symbols(['Yes', 'No', 'Okay', 'Maybe', 'More', 'Done', 'Finished', 'Again', 'Good', 'Bad'], 'interjection'),
    ], 'mulberry_good_eluzd6'),
    folder('Needs', [
      ...symbols(['Help', 'Wait', 'Stop', 'Go', 'Want', 'Need', 'Break', 'Rest', 'Toilet', 'Drink'], 'verb'),
    ], 'mulberry_help_1g1ppr'),
    folder('Social', [
      sym('Hello', 'social'), sym('Bye', 'social'), sym('Please', 'social'), sym('Thanks', 'social'),
      phrase('Sorry', 'I am sorry'), phrase('Excuse', 'Excuse me'), phrase('Like', 'I like it'), phrase('Turn', 'My turn'),
    ], 'mulberry_hello_1jyrbjf'),
    folder('Control', [
      phrase('Loud', 'Too loud'), phrase('Quiet', 'Please be quiet'), phrase('Space', 'I need space'),
      phrase('Choice', 'I want a choice'), phrase('Repeat', 'Please say that again'), phrase('Slow', 'Please slow down'),
    ], 'mulberry_quiet_4csbx1'),
  ]),
  pack('food', 'Food', 'Food', 'Daily', 'Meals, snacks, drinks, taste, and food requests.', 'mulberry_food_atkyaz', SYMBOL_ORANGE, [
    folder('Breakfast', [
      ...symbols(['Toast', 'Cereal', 'Porridge', 'Egg', 'Pancake', 'Fruit', 'Banana', 'Apple', 'Yoghurt', 'Milk']),
    ], 'mulberry_egg_1u25ooc'),
    folder('Lunch', [
      folder('Sweet', symbols(['Cake', 'Biscuit', 'Muffin', 'Honey', 'Jam', 'Custard', 'Jelly', 'Icecream'])),
      folder('Savoury', symbols(['Sandwich', 'Wrap', 'Soup', 'Rice', 'Pasta', 'Pizza', 'Chicken', 'Cheese'])),
      folder('Crunchy', symbols(['Chips', 'Crackers', 'Carrot', 'Apple', 'Toast', 'Cucumber', 'Popcorn'])),
    ], 'mulberry_pizza_rdymwh'),
    folder('Dinner', [
      ...symbols(['Meat', 'Fish', 'Chicken', 'Rice', 'Noodles', 'Pasta', 'Potato', 'Vegetables', 'Beans', 'Soup']),
    ], 'mulberry_chicken_live_2os875'),
    folder('Drinks', [
      ...symbols(['Water', 'Milk', 'Juice', 'Tea', 'Coffee', 'Smoothie', 'Bottle', 'Cup']),
    ], 'mulberry_water_139tuvw'),
    folder('Taste', [
      ...symbols(['Hot', 'Cold', 'Sweet', 'Sour', 'Salty', 'Spicy', 'Yummy', 'Yuck'], 'adjective'),
    ]),
  ]),
  pack('feelings', 'Feelings', 'Feelings', 'Body', 'Emotions, body states, and regulation words.', 'mulberry_happy_man_d75g78', SYMBOL_YELLOW, [
    folder('Good', symbols(['Happy', 'Excited', 'Calm', 'Proud', 'Safe', 'Brave', 'Loved', 'Ready'], 'adjective'), 'mulberry_happy_man_d75g78'),
    folder('Hard', symbols(['Sad', 'Angry', 'Worried', 'Afraid', 'Upset', 'Lonely', 'Tired', 'Confused'], 'adjective'), 'mulberry_sad_man_1xt7bsy'),
    folder('Body', symbols(['Hungry', 'Thirsty', 'Hot', 'Cold', 'Sick', 'Pain', 'Sleepy', 'Dizzy'], 'adjective'), 'mulberry_hungry_sp7py'),
    folder('Regulate', [
      phrase('Break', 'I need a break'), phrase('Quiet', 'I need quiet'), phrase('Space', 'I need space'),
      phrase('Help', 'Please help me'), phrase('Hug', 'I want a hug'), phrase('Breathe', 'I need to breathe'),
    ], 'mulberry_quiet_4csbx1'),
  ]),
  pack('health', 'Health', 'Health', 'Body', 'Pain, symptoms, body parts, medicine, and appointments.', 'mulberry_doctor_1a_lcuwh3', SYMBOL_RED, [
    folder('Pain', [
      folder('Body', symbols(['Head', 'Ear', 'Eye', 'Mouth', 'Tooth', 'Throat', 'Chest', 'Stomach', 'Back', 'Leg'])),
      folder('Feel', symbols(['Sharp', 'Sore', 'Burning', 'Itchy', 'Tight', 'Dizzy', 'Numb', 'Tired'], 'adjective')),
    ], 'mulberry_stomach_ache_16rpjjq'),
    folder('People', symbols(['Doctor', 'Nurse', 'Dentist', 'Therapist', 'Carer', 'Family', 'Pharmacist'])),
    folder('Care', symbols(['Medicine', 'Bandage', 'Cream', 'Rest', 'Sleep', 'Water', 'Toilet', 'Wash'])),
    folder('Places', symbols(['Hospital', 'Clinic', 'Pharmacy', 'Toilet', 'Bed', 'Home'])),
  ]),
  pack('people', 'People', 'People', 'Social', 'Family, helpers, school people, and community roles.', 'mulberry_family_excv0f', SYMBOL_PURPLE, [
    folder('Family', symbols(['Mum', 'Dad', 'Brother', 'Sister', 'Baby', 'Grandma', 'Grandpa', 'Cousin', 'Aunt', 'Uncle']), 'mulberry_family_excv0f'),
    folder('School', symbols(['Teacher', 'Friend', 'Student', 'Principal', 'Helper', 'Class', 'Coach'])),
    folder('Health', symbols(['Doctor', 'Nurse', 'Dentist', 'Therapist', 'Carer', 'Support'])),
    folder('Community', symbols(['Police', 'Firefighter', 'Driver', 'Shopkeeper', 'Neighbour', 'Worker'])),
  ]),
  pack('places', 'Places', 'Places', 'Community', 'Home, school, public places, and community destinations.', 'mulberry_house_1ice1xp', SYMBOL_BLUE, [
    folder('Home', symbols(['House', 'Bedroom', 'Kitchen', 'Bathroom', 'Garden', 'Door', 'Window', 'Bed']), 'mulberry_house_1ice1xp'),
    folder('School', symbols(['School', 'Class', 'Library', 'Office', 'Playground', 'Toilet', 'Canteen']), 'mulberry_school_7v1fml'),
    folder('Community', symbols(['Shop', 'Park', 'Beach', 'Hospital', 'Church', 'Cafe', 'Bank', 'Pool']), 'mulberry_shop_8euq19'),
    folder('Travel', symbols(['Station', 'Airport', 'Busstop', 'Road', 'Carpark', 'Crossing'])),
  ]),
  pack('transport', 'Transport', 'Transport', 'Community', 'Vehicles, public transport, road safety, and travel words.', 'mulberry_car_1m0ff95', SYMBOL_BLUE, [
    folder('Public', [
      folder('Train', symbols(['Train', 'Station', 'Platform', 'Ticket', 'Seat', 'Door'])),
      folder('Bus', symbols(['Bus', 'Stop', 'Driver', 'Ticket', 'Seat', 'Route'])),
      folder('Other', symbols(['Tram', 'Taxi', 'Ferry', 'Plane', 'Airport', 'Lift'])),
    ], 'mulberry_train_6zo4kp'),
    folder('Vehicles', symbols(['Car', 'Bike', 'Truck', 'Van', 'Boat', 'Plane', 'Scooter', 'Wheelchair']), 'mulberry_car_1m0ff95'),
    folder('Road', symbols(['Stop', 'Go', 'Wait', 'Cross', 'Road', 'Light', 'Safe', 'Danger'], 'verb')),
  ]),
  pack('school', 'School', 'School', 'Learning', 'Classroom tools, lessons, instructions, and school routines.', 'mulberry_school_7v1fml', SYMBOL_BLUE, [
    folder('Class', symbols(['Book', 'Pencil', 'Paper', 'Desk', 'Chair', 'Ruler', 'Glue', 'Scissors', 'Crayon', 'Bag']), 'mulberry_read_book_nw97ne'),
    folder('Lessons', symbols(['Read', 'Write', 'Count', 'Draw', 'Listen', 'Talk', 'Answer', 'Question'], 'verb'), 'mulberry_write_17xcc0z'),
    folder('People', symbols(['Teacher', 'Friend', 'Helper', 'Class', 'Student', 'Principal'])),
    folder('Routine', symbols(['Start', 'Finish', 'Break', 'Lunch', 'Recess', 'Pack', 'Line', 'Home'], 'verb')),
  ]),
  pack('home', 'Home', 'Home', 'Daily', 'Rooms, furniture, household items, and home routines.', 'mulberry_house_1ice1xp', SYMBOL_ORANGE, [
    folder('Rooms', symbols(['Kitchen', 'Bedroom', 'Bathroom', 'Lounge', 'Laundry', 'Garden', 'Garage'])),
    folder('Furniture', symbols(['Bed', 'Chair', 'Table', 'Sofa', 'Desk', 'Shelf', 'Lamp', 'Clock'])),
    folder('Objects', symbols(['Door', 'Window', 'Cup', 'Plate', 'Spoon', 'Fork', 'Towel', 'Soap'])),
    folder('Jobs', symbols(['Clean', 'Wash', 'Cook', 'Pack', 'Make', 'Open', 'Close', 'Help'], 'verb')),
  ]),
  pack('maths', 'Maths', 'Maths', 'Learning', 'Numbers, shapes, comparing, operations, and measuring.', 'mulberry_good_eluzd6', SYMBOL_YELLOW, [
    folder('Numbers', symbols(['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'])),
    folder('Actions', symbols(['Count', 'Add', 'Minus', 'Share', 'Group', 'Match', 'Sort', 'Measure'], 'verb')),
    folder('Shapes', symbols(['Circle', 'Square', 'Triangle', 'Star', 'Heart', 'Diamond', 'Cube'])),
    folder('Compare', symbols(['More', 'Less', 'Same', 'Different', 'Big', 'Small', 'Long', 'Short'], 'adjective')),
  ]),
  pack('hobbies', 'Hobbies', 'Hobbies', 'Interests', 'Creative play, music, games, collecting, and quiet leisure.', 'mulberry_play_juloe2', SYMBOL_GREEN, [
    folder('Creative', symbols(['Draw', 'Paint', 'Colour', 'Craft', 'Clay', 'Build', 'Photo', 'Write'], 'verb'), 'mulberry_draw_19hlq66'),
    folder('Music', symbols(['Sing', 'Dance', 'Song', 'Drum', 'Piano', 'Guitar', 'Listen'], 'verb'), 'mulberry_sing_v5z66l'),
    folder('Games', symbols(['Puzzle', 'Blocks', 'Cards', 'Dice', 'Board', 'Tablet', 'Turn', 'Win'])),
    folder('Quiet', symbols(['Read', 'Garden', 'Photo', 'Collect', 'Relax', 'Watch', 'Rest'], 'verb')),
  ]),
  pack('sports', 'Sports', 'Sports', 'Interests', 'Sports, movement, equipment, and team words.', 'mulberry_run_1l6fpg7', SYMBOL_GREEN, [
    folder('Movement', symbols(['Run', 'Walk', 'Jump', 'Swim', 'Dance', 'Kick', 'Throw', 'Catch'], 'verb'), 'mulberry_run_1l6fpg7'),
    folder('Games', symbols(['Soccer', 'Cricket', 'Tennis', 'Basketball', 'Footy', 'Netball', 'Bowling'])),
    folder('Gear', symbols(['Ball', 'Bat', 'Net', 'Goal', 'Shoes', 'Hat', 'Towel', 'Drink'])),
    folder('Team', symbols(['Turn', 'Team', 'Coach', 'Friend', 'Win', 'Lose', 'Score', 'Again'])),
  ]),
  pack('weather', 'Weather', 'Weather', 'World', 'Weather, seasons, temperature, and what to wear.', 'mulberry_snow_i6crm4', SYMBOL_BLUE, [
    folder('Weather', symbols(['Sun', 'Rain', 'Cloud', 'Storm', 'Wind', 'Snow', 'Fog', 'Rainbow'])),
    folder('Feel', symbols(['Hot', 'Cold', 'Warm', 'Cool', 'Wet', 'Dry', 'Muggy'], 'adjective')),
    folder('Seasons', symbols(['Summer', 'Winter', 'Autumn', 'Spring', 'Morning', 'Night'])),
    folder('Wear', symbols(['Hat', 'Coat', 'Shoes', 'Socks', 'Jumper', 'Gloves', 'Umbrella'])),
  ]),
  pack('time', 'Time', 'Time', 'Daily', 'Days, times, sequence, calendars, and waiting.', 'mulberry_wait_17bhqut', SYMBOL_BLUE, [
    folder('When', symbols(['Now', 'Soon', 'Later', 'Before', 'After', 'Today', 'Tomorrow', 'Yesterday'])),
    folder('Day', symbols(['Morning', 'Afternoon', 'Evening', 'Night', 'Lunch', 'Dinner', 'Bedtime'])),
    folder('Week', symbols(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])),
    folder('Sequence', symbols(['First', 'Next', 'Then', 'Last', 'Start', 'Finish', 'Wait'], 'adjective')),
  ]),
  pack('money', 'Money', 'Money', 'Community', 'Shopping, paying, banking, and money choices.', 'mulberry_shop_8euq19', SYMBOL_YELLOW, [
    folder('Money', symbols(['Coin', 'Note', 'Card', 'Cash', 'Change', 'Price', 'Receipt'])),
    folder('Actions', symbols(['Buy', 'Pay', 'Save', 'Spend', 'Choose', 'Need', 'Want'], 'verb')),
    folder('Shops', symbols(['Shop', 'Cafe', 'Market', 'Bank', 'Counter', 'Checkout'])),
    folder('Help', [phrase('Help', 'I need help paying'), phrase('Cost', 'How much does it cost'), phrase('Enough', 'Do I have enough money')]),
  ]),
  pack('technology', 'Technology', 'Tech', 'Daily', 'Devices, controls, media, and help with technology.', 'mulberry_tablets_79kdo0', SYMBOL_BLUE, [
    folder('Devices', symbols(['Phone', 'Tablet', 'Computer', 'TV', 'Camera', 'Remote', 'Mouse', 'Keyboard']), 'mulberry_tablets_79kdo0'),
    folder('Actions', symbols(['Call', 'Text', 'Watch', 'Listen', 'Play', 'Charge', 'Open', 'Close'], 'verb')),
    folder('Controls', symbols(['On', 'Off', 'Loud', 'Quiet', 'Stop', 'Start', 'Pause', 'Next'])),
    folder('Problems', [phrase('Broken', 'It is not working'), phrase('Help', 'I need help with this'), phrase('Charge', 'It needs charging')]),
  ]),
  pack('safety', 'Safety', 'Safety', 'Safety', 'Safety signs, body safety, trusted people, and help phrases.', 'mulberry_help_1g1ppr', SYMBOL_RED, [
    folder('Help', [
      phrase('Help', 'I need help', 'mulberry_help_1g1ppr'),
      phrase('Stop', 'Please stop'),
      phrase('Wait', 'Please wait', 'mulberry_wait_17bhqut'),
      phrase('AAC', 'I use A A C to communicate', 'mulberry_communication_device_m2l9ji'),
    ], 'mulberry_help_1g1ppr'),
    folder('Danger', symbols(['Fire', 'Police', 'Danger', 'Safe', 'Exit', 'Hot', 'Sharp', 'Road'])),
    folder('People', symbols(['Mum', 'Dad', 'Teacher', 'Police', 'Doctor', 'Carer', 'Friend'])),
    folder('Body', [phrase('No', 'No'), phrase('Stop', 'Stop'), phrase('Private', 'That is private'), phrase('Unsafe', 'I feel unsafe')]),
  ]),
  pack('routines', 'Routines', 'Routine', 'Daily', 'Morning, school, mealtime, bedtime, and transition words.', 'mulberry_wait_17bhqut', SYMBOL_GREEN, [
    folder('Morning', symbols(['Wake', 'Toilet', 'Wash', 'Dress', 'Breakfast', 'Teeth', 'Pack', 'Go'], 'verb')),
    folder('School', symbols(['Arrive', 'Unpack', 'Work', 'Break', 'Lunch', 'Pack', 'Home'], 'verb')),
    folder('Meal', symbols(['Sit', 'Eat', 'Drink', 'More', 'Finished', 'Clean', 'Wait'], 'verb')),
    folder('Bedtime', symbols(['Bath', 'Pyjamas', 'Teeth', 'Story', 'Sleep', 'Light', 'Goodnight'])),
  ]),
  pack('community', 'Community', 'Community', 'Community', 'Services, public places, helpers, and outings.', 'mulberry_park_18ux2ty', SYMBOL_BLUE, [
    folder('Services', symbols(['Library', 'Hospital', 'Clinic', 'Bank', 'Post', 'Council', 'Centre'])),
    folder('Places', symbols(['Park', 'Beach', 'Pool', 'Church', 'Cafe', 'Shop', 'Market', 'Museum'])),
    folder('People', symbols(['Police', 'Driver', 'Worker', 'Neighbour', 'Volunteer', 'Friend', 'Carer'])),
    folder('Outing', symbols(['Arrive', 'Leave', 'Wait', 'Queue', 'Ticket', 'Map', 'Toilet', 'Home'], 'verb')),
  ]),
  pack('animals', 'Animals', 'Animals', 'Interests', 'Pets, farm animals, wildlife, sea life, and animal actions.', 'mulberry_dog_1bfmoh1', SYMBOL_ORANGE, [
    folder('Pets', symbols(['Dog', 'Cat', 'Fish', 'Bird', 'Rabbit', 'Mouse', 'Horse'])),
    folder('Farm', symbols(['Cow', 'Sheep', 'Pig', 'Duck', 'Chicken', 'Goat', 'Horse'])),
    folder('Wild', symbols(['Lion', 'Tiger', 'Bear', 'Kangaroo', 'Koala', 'Snake', 'Frog'])),
    folder('Sea', symbols(['Fish', 'Shark', 'Whale', 'Crab', 'Turtle', 'Seal', 'Dolphin'])),
    folder('Actions', symbols(['Run', 'Jump', 'Swim', 'Fly', 'Eat', 'Sleep', 'Bark', 'Meow'], 'verb')),
  ]),
  pack('emergency', 'Emergency', 'Emergency', 'Safety', 'Protected urgent phrases and emergency contacts.', 'mulberry_help_1g1ppr', SYMBOL_RED, [
    folder('Urgent', [
      phrase('AAC', 'I use A A C to communicate', 'mulberry_communication_device_m2l9ji'),
      phrase('Help', 'I need help', 'mulberry_help_1g1ppr'),
      phrase('Pain', 'I am in pain', 'mulberry_stomach_ache_16rpjjq'),
      phrase('Call', 'Please call my support person', 'mulberry_telephone_mobile_npvlt1'),
      phrase('Wait', 'Please wait', 'mulberry_wait_17bhqut'),
    ], 'mulberry_help_1g1ppr'),
    folder('Services', symbols(['Police', 'Fire', 'Doctor', 'Hospital', 'Ambulance', 'Nurse'])),
    folder('Details', [phrase('Name', 'My name is'), phrase('Address', 'My address is'), phrase('Phone', 'My phone number is')]),
  ]),
  pack('personal-care', 'Personal Care', 'Care', 'Daily', 'Toileting, washing, clothing, grooming, and privacy.', 'mulberry_wash_hands_zcbt6k', SYMBOL_PURPLE, [
    folder('Toilet', symbols(['Toilet', 'Nappy', 'Wipe', 'Paper', 'Flush', 'Wash', 'Privacy', 'Help'])),
    folder('Wash', symbols(['Hands', 'Face', 'Hair', 'Teeth', 'Shower', 'Bath', 'Soap', 'Towel'], 'verb'), 'mulberry_wash_hands_zcbt6k'),
    folder('Clothes', symbols(['Shirt', 'Pants', 'Dress', 'Socks', 'Shoes', 'Hat', 'Coat', 'Jumper'])),
    folder('Grooming', symbols(['Brush', 'Comb', 'Deodorant', 'Cream', 'Glasses', 'Hearing', 'Mirror'])),
  ]),
];

export function presetPackBoardKey(packId: string): string {
  return `preset_${packId}`;
}

export function presetPackHomeTileId(packId: string): string {
  return `preset_${packId}_home`;
}

function childBoardKey(packId: string, path: string[]): string {
  return [presetPackBoardKey(packId), ...path.map(slug)].join('_');
}

function tileId(packId: string, path: string[], label: string, index: number): string {
  return [presetPackBoardKey(packId), ...path.map(slug), slug(label), String(index)].join('_');
}

function boardHomeTile(boardKey: string): PresetBoardTile {
  return {
    id: `home-${boardKey}`,
    label: 'Home',
    kind: 'folder',
    target: 'home',
    color: FOLDER_COLOR,
    mulberrySymbolId: SYMBOL_IDS.home,
  };
}

function buildBoard(
  pack: PresetSymbolPack,
  folderNode: { children: PresetPackNode[] },
  path: string[],
  boards: Record<string, PresetBoardTile[]>,
): void {
  const boardKey = path.length === 0 ? presetPackBoardKey(pack.id) : childBoardKey(pack.id, path);
  const tiles: PresetBoardTile[] = [];
  let index = 0;
  for (const child of folderNode.children) {
    if (child.type === 'folder') {
      const childPath = [...path, child.id];
      tiles.push({
        id: tileId(pack.id, path, child.label, index),
        label: oneWordLabel(child.label),
        kind: 'folder',
        color: FOLDER_COLOR,
        target: childBoardKey(pack.id, childPath),
        mulberrySymbolId: child.iconId,
      });
      buildBoard(pack, child, childPath, boards);
    } else {
      tiles.push({
        id: tileId(pack.id, path, child.label, index),
        label: child.label,
        kind: 'word',
        color: WORD_TYPE_COLOR[child.wordType ?? 'noun'],
        speech: child.speech ?? child.label.toLowerCase(),
        mulberrySymbolId: child.symbolId,
        wordType: child.wordType ?? 'noun',
        isProtected: pack.id === 'emergency',
      });
    }
    index += 1;
  }
  if (path.length > 0) tiles.push(boardHomeTile(boardKey));
  boards[boardKey] = tiles;
}

export function buildPresetPackBoards(installedPackIds: string[]): Record<string, PresetBoardTile[]> {
  const boards: Record<string, PresetBoardTile[]> = {};
  const homeTiles: PresetBoardTile[] = [];
  for (const packId of installedPackIds) {
    const packDef = PRESET_SYMBOL_PACKS.find(pack => pack.id === packId);
    if (!packDef) continue;
    homeTiles.push({
      id: presetPackHomeTileId(packDef.id),
      label: packDef.boardLabel,
      kind: 'folder',
      color: FOLDER_COLOR,
      target: presetPackBoardKey(packDef.id),
      mulberrySymbolId: packDef.iconId,
    });
    buildBoard(packDef, { children: packDef.children }, [], boards);
  }
  if (homeTiles.length > 0) boards.home = homeTiles;
  return boards;
}

export function presetPackStats(packDef: PresetSymbolPack): PresetPackStats {
  let symbolsCount = 0;
  let foldersCount = 0;
  const samplePaths: string[] = [];
  const walk = (nodes: PresetPackNode[], path: string[]) => {
    for (const node of nodes) {
      if (node.type === 'folder') {
        foldersCount += 1;
        walk(node.children, [...path, node.label]);
      } else {
        symbolsCount += 1;
        if (samplePaths.length < 4) {
          samplePaths.push([...path, node.label].join(' > '));
        }
      }
    }
  };
  walk(packDef.children, [packDef.title]);
  return { symbols: symbolsCount, folders: foldersCount, samplePaths };
}
