export const BUILDER_OPTIONS = {
  bases: [
    { id: 'classic', name: 'Classic Thin', price: 120, image: '/images/bases/classic-thin.png' },
    { id: 'hand-tossed', name: 'Hand Tossed', price: 140, image: '/images/bases/hand-tossed.png' },
    { id: 'whole-wheat', name: 'Whole Wheat', price: 160, image: '/images/bases/whole-wheat.png' },
    { id: 'cheesy-crust', name: 'Cheesy Crust', price: 180, image: '/images/bases/cheesy-crust.png' },
    { id: 'gluten-free', name: 'Gluten Free', price: 200, image: '/images/bases/gluten-free.png' },
  ],
  sauces: [
    { id: 'tomato', name: 'Classic Tomato', price: 0, image: '/images/sauces/classic-tomato.png' },
    { id: 'marinara', name: 'Marinara', price: 15, image: '/images/sauces/marinara.png' },
    { id: 'pesto', name: 'Basil Pesto', price: 25, image: '/images/sauces/basil-pesto.png' },
    { id: 'alfredo', name: 'Creamy Alfredo', price: 30, image: '/images/sauces/creamy-alfredo.png' },
    { id: 'spicy', name: 'Spicy Arrabbiata', price: 20, image: '/images/sauces/spicy-arrabbiata.png' },
  ],
  cheeses: [
    { id: 'mozzarella', name: 'Mozzarella', price: 0, image: '/images/cheeses/mozzarella.png' },
    { id: 'cheddar', name: 'Cheddar', price: 20, image: '/images/cheeses/cheddar.png' },
    { id: 'parmesan', name: 'Parmesan', price: 30, image: '/images/cheeses/parmesan.png' },
    { id: 'gouda', name: 'Smoked Gouda', price: 35, image: '/images/cheeses/smoked-gouda.png' },
  ],
  vegetables: [
    { id: 'onion', name: 'Onion', price: 15, image: '/images/veggies/onion.png' },
    { id: 'capsicum', name: 'Capsicum', price: 15, image: '/images/veggies/capsicum.png' },
    { id: 'mushroom', name: 'Mushroom', price: 20, image: '/images/veggies/mushroom.png' },
    { id: 'corn', name: 'Sweet Corn', price: 20, image: '/images/veggies/corn.png' },
    { id: 'olive', name: 'Black Olive', price: 25, image: '/images/veggies/olive.png' },
    { id: 'jalapeno', name: 'Jalapeño', price: 20, image: '/images/veggies/jalapeno.png' },
  ],
};

export function findOption(category, id) {
  return BUILDER_OPTIONS[category]?.find((option) => option.id === id) ?? null;
}
