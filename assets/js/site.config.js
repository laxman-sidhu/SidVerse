/* SidVerse — the one place the site describes itself.
   Loaded as a plain script before shell.js, so every page can read it whether
   or not that page uses ES modules. */

window.SIDVERSE = {
  name: "SidVerse",
  tagline: "a box of everything I keep",
  owner: "Siddhesh",

  /* The home hero. A background-removed PNG sits best — it floats on the
     colour rather than in a frame. */
  portrait: "assets/images/portrait-cutout.png",
  portraitAlt: "Siddhesh",

  intro:
    "Films I have watched, books I have read, roads I have taken, food I have eaten, " +
    "the things I love without a good reason, and pages I have written down. " +
    "Six small habits, kept in one place.",

  /* The sidebar and the front page are both built from this list. Reorder it
     and both follow.

     `image` is the thumbnail on the front-page card. Point it anywhere — a file
     under assets/images/cards/ or a full https:// URL. The ones shipped are
     drawn SVGs; drop a photograph in at the same path, or change the value
     here, and nothing else needs touching.

     `phrase` is the module's hero line, in the language its name suggests.
     `gloss` is what it means, shown on hover. */
  sections: [
    {
      key: "cinema",
      tip: "Cinema",
      site: "SidCinemas",
      phrase: "D\u00e9couverte de films.",
      gloss: "French - \u201cDiscovering Films\u201d",
      footerLine: "We don't make movies to make money, we make money to make more movies. - Walt Disney",
      footerLinks: [],
      ownFooter: true,
      image: "https://images.adsttc.com/media/images/58d5/3a58/e58e/ce48/a700/003f/newsletter/002.jpg?1490369108",
      label: "Cinema",
      href: "modules/cinema/",
      blurb: "Every film and series I have finished, and the queue that never shrinks.",
      note: "Searches TMDB, cross-referenced against my sheet",
      icon: "film"
    },
    {
      key: "books",
      tip: "Books",
      site: "SidBooks",
      phrase: "Ket\u0101bi pas az ket\u0101bi.",
      gloss: "Persian - \u201cOne Book after Another\u201d",
      footerLine: "A reader lives a thousand lives before he dies. - George R. R. Martin",
      footerLinks: [],
      ownFooter: false,
      image: "https://images.theconversation.com/files/45159/original/rptgtpxd-1396254731.jpg?ixlib=rb-4.1.1&q=45&auto=format&w=754&fit=clip",
      label: "Books",
      href: "modules/books/",
      blurb: "What I have read, what is waiting, and every printing in between.",
      note: "Google Books and Open Library",
      icon: "book"
    },
    {
      key: "travel",
      tip: "Travel",
      site: "SidTrails",
      phrase: "Ogni viaggio lascia una storia.",
      gloss: "Italian - \u201cEvery Journey Leaves a Story\u201d",
      footerLine: "The world is a book, and those who do not travel read only one page. - Saint Augustine",
      footerLinks: [],
      // A card rather than a link: the album is the one place worth going from here.
      footerFeature: {
        href: "gallery.html",
        eyebrow: "A personal album",
        title: "The",
        titleEm: "gallery",
        sub: "Glimpses from the road: every photo, every video, in one place.",
        cta: "Open gallery",
        shots: [
          "https://res.cloudinary.com/dadtqawh5/image/upload/v1780377750/manali_wrfd8h.jpg",
          "https://res.cloudinary.com/dadtqawh5/image/upload/v1780377750/cycle_beach_m8cfv9.jpg",
          "https://res.cloudinary.com/dadtqawh5/image/upload/v1780377750/beach_yiymxk.jpg"
        ]
      },
      ownFooter: false,
      image: "https://c.ndtvimg.com/2025-05/qgckc648_air-travel_625x300_26_May_25.jpg?im=FaceCrop,algorithm=dnn,width=1200,height=738",
      label: "Travel",
      href: "modules/travel/",
      blurb: "Places seen, monuments walked through, treks done, and the wishlist.",
      note: "A dashboard, a map and a gallery",
      icon: "compass"
    },
    {
      key: "food",
      tip: "Food",
      site: "SidBites",
      phrase: "Bom apetite.",
      gloss: "Portuguese - \u201cEnjoy your Meal\u201d",
      footerLine: "People who love to eat are always the best people. - Julia Child",
      footerLinks: [],
      ownFooter: false,
      image: "https://i.ytimg.com/vi/IBlIMdCyVgw/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAdPgE8zgq6MmyB1fN1xEYffhybtw",
      label: "Food",
      href: "modules/food/",
      blurb: "A tasting log. Every dish worth remembering, and where I ate it.",
      note: "Photographed, rated, written down",
      icon: "bowl"
    },
    {
      key: "favourites",
      tip: "Favourites",
      site: "SidPicks",
      phrase: "Museo de favoritos.",
      gloss: "Spanish - \u201cMuseum of Favourites\u201d",
      footerLine: "We are all of us stars, and we deserve to twinkle. - Marilyn Monroe",
      footerLinks: [],
      ownFooter: false,
      image: "https://m.media-amazon.com/images/I/81uzj4XishL.jpg",
      label: "Favourites",
      href: "modules/favourites/",
      blurb: "A small museum of the people and characters I keep coming back to.",
      note: "Actors, actresses, heroes, villains",
      icon: "star"
    },
    {
      key: "journal",
      tip: "Journal",
      site: "SidNotes",
      phrase: "Escrito \u00e0 m\u00e3o.",
      gloss: "Portuguese - \u201cWritten by Hand\u201d",
      footerLine: "Fill your paper with the breathings of your heart. - William Wordsworth",
      footerLinks: [],
      ownFooter: false,
      image: "https://papernest.in/cdn/shop/articles/Copy_of_for_Your_Website.png?v=1763576349",
      label: "Journal",
      href: "modules/journal/",
      blurb: "Scrapbook pages. Longer thoughts, laid out by hand.",
      note: "Written elsewhere, kept here",
      icon: "pen"
    }
  ],

  /* Footers. Every module gets the same footer, built from its own
     `footerLine` above plus this signature. `ownFooter: true` means the module
     already has one worth keeping and nothing is injected. */
  madeBy: "ME",

  /* Leave a value empty and its link is not drawn. */
  links: {
    instagram: "https://www.instagram.com/sawant_sidhu/?hl=en",
    github: ""
  },

  footerLine: "We are the sum of all the moments of our lives. - Thomas Wolfe"
};
