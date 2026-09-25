export const BUILDER_OPTIONS = {
  bases: [
    { id: 'classic', name: 'Classic Thin', price: 120 },
    { id: 'hand-tossed', name: 'Hand Tossed', price: 140 },
    { id: 'whole-wheat', name: 'Whole Wheat', price: 150 },
    { id: 'cheesy-crust', name: 'Cheesy Crust', price: 180 },
    { id: 'gluten-free', name: 'Gluten Free', price: 200 },
  ],
  sauces: [
    { id: 'tomato', name: 'Classic Tomato', price: 0 },
    { id: 'marinara', name: 'Marinara', price: 15 },
    { id: 'pesto', name: 'Basil Pesto', price: 25 },
    { id: 'alfredo', name: 'Creamy Alfredo', price: 30 },
    { id: 'spicy', name: 'Spicy Arrabbiata', price: 20 },
  ],
  cheeses: [
    { id: 'mozzarella', name: 'Mozzarella', price: 0 },
    { id: 'cheddar', name: 'Cheddar', price: 20 },
    { id: 'parmesan', name: 'Parmesan', price: 30 },
    { id: 'gouda', name: 'Smoked Gouda', price: 35 },
  ],
  vegetables: [
    { id: 'onion', name: 'Onion', price: 15 },
    { id: 'capsicum', name: 'Capsicum', price: 15 },
    { id: 'mushroom', name: 'Mushroom', price: 20 },
    { id: 'corn', name: 'Sweet Corn', price: 20 },
    { id: 'olive', name: 'Black Olive', price: 25 },
    { id: 'jalapeno', name: 'Jalapeño', price: 20 },
  ],
};

export function findOption(category, id) {
  return BUILDER_OPTIONS[category]?.find((option) => option.id === id) ?? null;
}
