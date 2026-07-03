/**
 * Symbol Packs — ready-made category folders the user can drop onto a board
 * from the Add flow (+ → Pack). Each pack becomes a folder tile whose child
 * board is pre-filled with one-word tiles. Symbols are auto-resolved from the
 * label by the board's symbol resolver, so packs only carry labels + a word
 * type (which drives the Fitzgerald tile colour). Speech = the label.
 *
 * 50+ broad categories. Keep labels ONE word (board rule); anything longer
 * belongs in speech, not on a tile.
 */

export type PackWordType = 'noun' | 'verb' | 'adjective' | 'social' | 'interjection';

export interface SymbolPack {
  id: string;
  name: string;      // folder label (one/two words)
  wordType: PackWordType; // default type → colour for the pack's tiles
  words: string[];   // one-word tile labels
}

export const SYMBOL_PACKS: SymbolPack[] = [
  { id: 'quick-action', name: 'Quick Action', wordType: 'verb', words: ['Stop', 'Go', 'Help', 'Wait', 'More', 'Done', 'Yes', 'No'] },
  { id: 'transport', name: 'Transport', wordType: 'noun', words: ['Car', 'Bus', 'Train', 'Plane', 'Bike', 'Boat', 'Truck', 'Taxi'] },
  { id: 'food', name: 'Food', wordType: 'noun', words: ['Bread', 'Rice', 'Pasta', 'Pizza', 'Egg', 'Soup', 'Cheese', 'Meat'] },
  { id: 'drinks', name: 'Drinks', wordType: 'noun', words: ['Water', 'Milk', 'Juice', 'Tea', 'Coffee', 'Soda', 'Smoothie'] },
  { id: 'fruit', name: 'Fruit', wordType: 'noun', words: ['Apple', 'Banana', 'Orange', 'Grape', 'Pear', 'Melon', 'Berry'] },
  { id: 'vegetables', name: 'Veggies', wordType: 'noun', words: ['Carrot', 'Potato', 'Peas', 'Corn', 'Onion', 'Tomato', 'Bean'] },
  { id: 'animals', name: 'Animals', wordType: 'noun', words: ['Dog', 'Cat', 'Cow', 'Horse', 'Sheep', 'Pig', 'Rabbit', 'Bear'] },
  { id: 'pets', name: 'Pets', wordType: 'noun', words: ['Dog', 'Cat', 'Fish', 'Bird', 'Rabbit', 'Hamster'] },
  { id: 'farm', name: 'Farm', wordType: 'noun', words: ['Cow', 'Pig', 'Sheep', 'Horse', 'Duck', 'Chicken', 'Goat'] },
  { id: 'sea-animals', name: 'Sea Life', wordType: 'noun', words: ['Fish', 'Shark', 'Whale', 'Crab', 'Turtle', 'Octopus', 'Seal'] },
  { id: 'birds', name: 'Birds', wordType: 'noun', words: ['Duck', 'Owl', 'Eagle', 'Parrot', 'Penguin', 'Chicken'] },
  { id: 'insects', name: 'Insects', wordType: 'noun', words: ['Bee', 'Ant', 'Fly', 'Spider', 'Butterfly', 'Ladybug'] },
  { id: 'body', name: 'Body', wordType: 'noun', words: ['Head', 'Hand', 'Foot', 'Eye', 'Ear', 'Nose', 'Mouth', 'Arm'] },
  { id: 'clothing', name: 'Clothes', wordType: 'noun', words: ['Shirt', 'Pants', 'Shoes', 'Hat', 'Coat', 'Socks', 'Dress'] },
  { id: 'colours', name: 'Colours', wordType: 'adjective', words: ['Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Black'] },
  { id: 'numbers', name: 'Numbers', wordType: 'noun', words: ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'] },
  { id: 'shapes', name: 'Shapes', wordType: 'noun', words: ['Circle', 'Square', 'Triangle', 'Star', 'Heart', 'Diamond'] },
  { id: 'weather', name: 'Weather', wordType: 'noun', words: ['Sun', 'Rain', 'Cloud', 'Snow', 'Wind', 'Storm', 'Fog'] },
  { id: 'seasons', name: 'Seasons', wordType: 'noun', words: ['Summer', 'Winter', 'Spring', 'Autumn'] },
  { id: 'family', name: 'Family', wordType: 'noun', words: ['Mum', 'Dad', 'Sister', 'Brother', 'Baby', 'Grandma', 'Grandpa'] },
  { id: 'feelings', name: 'Feelings', wordType: 'adjective', words: ['Happy', 'Sad', 'Angry', 'Tired', 'Scared', 'Excited', 'Calm'] },
  { id: 'actions', name: 'Actions', wordType: 'verb', words: ['Run', 'Walk', 'Jump', 'Sit', 'Play', 'Eat', 'Drink', 'Sleep'] },
  { id: 'school', name: 'School', wordType: 'noun', words: ['Book', 'Pen', 'Desk', 'Bag', 'Ruler', 'Paper', 'Teacher'] },
  { id: 'classroom', name: 'Class', wordType: 'noun', words: ['Chair', 'Board', 'Clock', 'Glue', 'Scissors', 'Crayon'] },
  { id: 'sports', name: 'Sports', wordType: 'noun', words: ['Ball', 'Soccer', 'Tennis', 'Swim', 'Run', 'Dance', 'Cricket'] },
  { id: 'hobbies', name: 'Hobbies', wordType: 'noun', words: ['Draw', 'Read', 'Sing', 'Cook', 'Garden', 'Puzzle', 'Photo'] },
  { id: 'music', name: 'Music', wordType: 'noun', words: ['Song', 'Sing', 'Dance', 'Drum', 'Piano', 'Guitar'] },
  { id: 'instruments', name: 'Instruments', wordType: 'noun', words: ['Piano', 'Guitar', 'Drum', 'Violin', 'Flute', 'Trumpet'] },
  { id: 'art', name: 'Art', wordType: 'noun', words: ['Paint', 'Brush', 'Colour', 'Draw', 'Clay', 'Paper'] },
  { id: 'nature', name: 'Nature', wordType: 'noun', words: ['Tree', 'Flower', 'Grass', 'Rock', 'River', 'Mountain', 'Leaf'] },
  { id: 'plants', name: 'Plants', wordType: 'noun', words: ['Tree', 'Flower', 'Seed', 'Leaf', 'Root', 'Grass'] },
  { id: 'space', name: 'Space', wordType: 'noun', words: ['Sun', 'Moon', 'Star', 'Planet', 'Rocket', 'Earth'] },
  { id: 'ocean', name: 'Ocean', wordType: 'noun', words: ['Wave', 'Beach', 'Shell', 'Sand', 'Boat', 'Fish'] },
  { id: 'home', name: 'Home', wordType: 'noun', words: ['House', 'Door', 'Window', 'Bed', 'Table', 'Chair'] },
  { id: 'kitchen', name: 'Kitchen', wordType: 'noun', words: ['Cup', 'Plate', 'Fork', 'Spoon', 'Knife', 'Bowl', 'Pot'] },
  { id: 'bathroom', name: 'Bathroom', wordType: 'noun', words: ['Toilet', 'Soap', 'Towel', 'Toothbrush', 'Bath', 'Sink'] },
  { id: 'bedroom', name: 'Bedroom', wordType: 'noun', words: ['Bed', 'Pillow', 'Blanket', 'Lamp', 'Clock', 'Dresser'] },
  { id: 'furniture', name: 'Furniture', wordType: 'noun', words: ['Chair', 'Table', 'Sofa', 'Bed', 'Shelf', 'Desk'] },
  { id: 'technology', name: 'Tech', wordType: 'noun', words: ['Phone', 'Tablet', 'Computer', 'TV', 'Camera', 'Mouse'] },
  { id: 'tools', name: 'Tools', wordType: 'noun', words: ['Hammer', 'Saw', 'Nail', 'Drill', 'Ruler', 'Screw'] },
  { id: 'jobs', name: 'Jobs', wordType: 'noun', words: ['Doctor', 'Teacher', 'Chef', 'Nurse', 'Farmer', 'Police'] },
  { id: 'places', name: 'Places', wordType: 'noun', words: ['School', 'Shop', 'Park', 'Home', 'Beach', 'Hospital'] },
  { id: 'time', name: 'Time', wordType: 'noun', words: ['Morning', 'Night', 'Today', 'Now', 'Later', 'Soon'] },
  { id: 'days', name: 'Days', wordType: 'noun', words: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
  { id: 'months', name: 'Months', wordType: 'noun', words: ['January', 'March', 'June', 'July', 'October', 'December'] },
  { id: 'money', name: 'Money', wordType: 'noun', words: ['Coin', 'Note', 'Card', 'Buy', 'Pay', 'Save'] },
  { id: 'shopping', name: 'Shopping', wordType: 'noun', words: ['Shop', 'Bag', 'List', 'Buy', 'Pay', 'Cart'] },
  { id: 'health', name: 'Health', wordType: 'noun', words: ['Doctor', 'Nurse', 'Sick', 'Rest', 'Sleep', 'Well'] },
  { id: 'medicine', name: 'Medicine', wordType: 'noun', words: ['Pill', 'Bandage', 'Doctor', 'Nurse', 'Rest', 'Pain'] },
  { id: 'safety', name: 'Safety', wordType: 'noun', words: ['Stop', 'Help', 'Safe', 'Danger', 'Fire', 'Exit'] },
  { id: 'mathematics', name: 'Maths', wordType: 'noun', words: ['Add', 'Minus', 'Equals', 'Count', 'Number', 'Shape'] },
  { id: 'science', name: 'Science', wordType: 'noun', words: ['Water', 'Air', 'Plant', 'Rock', 'Magnet', 'Light'] },
  { id: 'games', name: 'Games', wordType: 'noun', words: ['Ball', 'Card', 'Puzzle', 'Dice', 'Blocks', 'Board'] },
  { id: 'toys', name: 'Toys', wordType: 'noun', words: ['Ball', 'Doll', 'Car', 'Blocks', 'Teddy', 'Kite'] },
];
