const recipes = [
  {
    id: 'pesarattu',
    title: 'Pesarattu',
    region: 'Andhra',
    veg: true,
    spice: 2,
    minutes: 30,
    ingredients: ['Green gram (soaked)', 'Green chilli', 'Ginger', 'Onion', 'Cumin', 'Salt'],
    steps: ['Grind green gram with chilli and ginger.', 'Spread on a hot tawa.', 'Top with onion and cumin, cook till crisp.']
  },
  {
    id: 'gongura-chicken',
    title: 'Gongura Chicken',
    region: 'Andhra',
    veg: false,
    spice: 3,
    minutes: 50,
    ingredients: ['Chicken', 'Gongura leaves', 'Onion', 'Red chilli powder', 'Ginger garlic paste', 'Oil'],
    steps: ['Cook gongura leaves into a paste.', 'Fry onion and masala, add chicken.', 'Mix in gongura and simmer.']
  },
  {
    id: 'bobbatlu',
    title: 'Bobbatlu',
    region: 'Andhra',
    veg: true,
    spice: 0,
    minutes: 60,
    ingredients: ['Chana dal', 'Jaggery', 'Cardamom', 'Maida', 'Ghee'],
    steps: ['Cook dal with jaggery into a filling.', 'Stuff into dough and roll thin.', 'Roast with ghee.']
  },
  {
    id: 'fish-pulusu',
    title: 'Chepala Pulusu',
    region: 'Coastal Andhra',
    veg: false,
    spice: 3,
    minutes: 45,
    ingredients: ['Fish', 'Tamarind', 'Onion', 'Tomato', 'Chilli powder', 'Fenugreek'],
    steps: ['Make tamarind water.', 'Cook onion, tomato and spices.', 'Add tamarind and fish, simmer gently.']
  }
]

export default recipes
