
export const SHOPPING_CATEGORIES = [
  "Obst & Gemüse",
  "Milchprodukte & Eier",
  "Fleisch & Wurst",
  "Fisch & Meeresfrüchte",
  "Brot & Backwaren",
  "Nudeln, Reis & Getreide",
  "Konserven & Fertiggerichte",
  "Tiefkühlkost",
  "Süßwaren & Snacks",
  "Getränke",
  "Haushalt & Drogerie",
  "Sonstiges"
];

export const COMMON_GROCERY_ITEMS: { name: string; category: string }[] = [
    // Obst & Gemüse
    { name: "Äpfel", category: "Obst & Gemüse" },
    { name: "Bananen", category: "Obst & Gemüse" },
    { name: "Orangen", category: "Obst & Gemüse" },
    { name: "Trauben", category: "Obst & Gemüse" },
    { name: "Erdbeeren", category: "Obst & Gemüse" },
    { name: "Blaubeeren", category: "Obst & Gemüse" },
    { name: "Himbeeren", category: "Obst & Gemüse" },
    { name: "Avocado", category: "Obst & Gemüse" },
    { name: "Zitronen", category: "Obst & Gemüse" },
    { name: "Limetten", category: "Obst & Gemüse" },
    { name: "Tomaten", category: "Obst & Gemüse" },
    { name: "Gurken", category: "Obst & Gemüse" },
    { name: "Paprika", category: "Obst & Gemüse" },
    { name: "Karotten", category: "Obst & Gemüse" },
    { name: "Kartoffeln", category: "Obst & Gemüse" },
    { name: "Zwiebeln", category: "Obst & Gemüse" },
    { name: "Knoblauch", category: "Obst & Gemüse" },
    { name: "Salat", category: "Obst & Gemüse" },
    { name: "Spinat", category: "Obst & Gemüse" },
    { name: "Brokkoli", category: "Obst & Gemüse" },
    { name: "Blumenkohl", category: "Obst & Gemüse" },
    { name: "Champignons", category: "Obst & Gemüse" },
    { name: "Ingwer", category: "Obst & Gemüse" },

    // Milchprodukte & Eier
    { name: "Milch", category: "Milchprodukte & Eier" },
    { name: "Joghurt", category: "Milchprodukte & Eier" },
    { name: "Käse", category: "Milchprodukte & Eier" },
    { name: "Butter", category: "Milchprodukte & Eier" },
    { name: "Margarine", category: "Milchprodukte & Eier" },
    { name: "Eier", category: "Milchprodukte & Eier" },
    { name: "Quark", category: "Milchprodukte & Eier" },
    { name: "Sahne", category: "Milchprodukte & Eier" },
    { name: "Frischkäse", category: "Milchprodukte & Eier" },
    { name: "Parmesan", category: "Milchprodukte & Eier" },

    // Fleisch & Wurst
    { name: "Hähnchenbrust", category: "Fleisch & Wurst" },
    { name: "Hackfleisch", category: "Fleisch & Wurst" },
    { name: "Rindfleisch", category: "Fleisch & Wurst" },
    { name: "Schweinefleisch", category: "Fleisch & Wurst" },
    { name: "Speck", category: "Fleisch & Wurst" },
    { name: "Salami", category: "Fleisch & Wurst" },
    { name: "Schinken", category: "Fleisch & Wurst" },
    { name: "Wurst", category: "Fleisch & Wurst" },

    // Fisch & Meeresfrüchte
    { name: "Lachs", category: "Fisch & Meeresfrüchte" },
    { name: "Thunfisch", category: "Fisch & Meeresfrüchte" },
    { name: "Garnelen", category: "Fisch & Meeresfrüchte" },

    // Brot & Backwaren
    { name: "Brot", category: "Brot & Backwaren" },
    { name: "Brötchen", category: "Brot & Backwaren" },
    { name: "Toastbrot", category: "Brot & Backwaren" },
    { name: "Mehl", category: "Brot & Backwaren" },
    { name: "Zucker", category: "Brot & Backwaren" },
    { name: "Backpulver", category: "Brot & Backwaren" },
    { name: "Hefe", category: "Brot & Backwaren" },

    // Nudeln, Reis & Getreide
    { name: "Nudeln", category: "Nudeln, Reis & Getreide" },
    { name: "Reis", category: "Nudeln, Reis & Getreide" },
    { name: "Haferflocken", category: "Nudeln, Reis & Getreide" },
    { name: "Müsli", category: "Nudeln, Reis & Getreide" },
    { name: "Couscous", category: "Nudeln, Reis & Getreide" },
    { name: "Quinoa", category: "Nudeln, Reis & Getreide" },

    // Konserven & Fertiggerichte
    { name: "Tomaten (Dose)", category: "Konserven & Fertiggerichte" },
    { name: "Mais (Dose)", category: "Konserven & Fertiggerichte" },
    { name: "Bohnen (Dose)", category: "Konserven & Fertiggerichte" },
    { name: "Kichererbsen (Dose)", category: "Konserven & Fertiggerichte" },
    { name: "Tomatenmark", category: "Konserven & Fertiggerichte" },
    { name: "Pesto", category: "Konserven & Fertiggerichte" },
    { name: "Senf", category: "Konserven & Fertiggerichte" },
    { name: "Ketchup", category: "Konserven & Fertiggerichte" },
    { name: "Mayonnaise", category: "Konserven & Fertiggerichte" },
    { name: "Olivenöl", category: "Konserven & Fertiggerichte" },
    { name: "Sonnenblumenöl", category: "Konserven & Fertiggerichte" },
    { name: "Essig", category: "Konserven & Fertiggerichte" },

    // Tiefkühlkost
    { name: "Pizza", category: "Tiefkühlkost" },
    { name: "Pommes Frites", category: "Tiefkühlkost" },
    { name: "Tiefkühlgemüse", category: "Tiefkühlkost" },
    { name: "Eis", category: "Tiefkühlkost" },

    // Süßwaren & Snacks
    { name: "Schokolade", category: "Süßwaren & Snacks" },
    { name: "Chips", category: "Süßwaren & Snacks" },
    { name: "Nüsse", category: "Süßwaren & Snacks" },
    { name: "Kekse", category: "Süßwaren & Snacks" },
    { name: "Honig", category: "Süßwaren & Snacks" },
    { name: "Marmelade", category: "Süßwaren & Snacks" },

    // Getränke
    { name: "Wasser", category: "Getränke" },
    { name: "Apfelsaft", category: "Getränke" },
    { name: "Orangensaft", category: "Getränke" },
    { name: "Cola", category: "Getränke" },
    { name: "Kaffee", category: "Getränke" },
    { name: "Tee", category: "Getränke" },
    { name: "Bier", category: "Getränke" },
    { name: "Wein", category: "Getränke" },

    // Haushalt & Drogerie
    { name: "Toilettenpapier", category: "Haushalt & Drogerie" },
    { name: "Küchenrolle", category: "Haushalt & Drogerie" },
    { name: "Spülmittel", category: "Haushalt & Drogerie" },
    { name: "Waschmittel", category: "Haushalt & Drogerie" },
    { name: "Müllbeutel", category: "Haushalt & Drogerie" },
    { name: "Zahnpasta", category: "Haushalt & Drogerie" },
    { name: "Shampoo", category: "Haushalt & Drogerie" },
    { name: "Seife", category: "Haushalt & Drogerie" },
];
