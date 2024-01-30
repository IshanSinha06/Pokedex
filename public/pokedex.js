"use strict";

const header = document.querySelector(".header");
const container = document.querySelector(".container");
const card = document.querySelector(".card");
const loadMore = document.querySelector(".load-more");
const collapse = document.querySelector(".btn-collapse");
const userInput = document.querySelector("textarea");
const searchInput = document.querySelector(".searchInput");
const resultBox = document.querySelector(".resultBox");
const btnSurprise = document.querySelector(".btn-surprise");
const notFoundMessage = document.querySelector(".not-found");
const dropdown = document.querySelector(".dropdown");
const select = document.querySelector(".select");
const expand = document.getElementById("expand");
const menu = document.querySelector(".menu");
const options = document.querySelectorAll(".menu li");
const selected = document.querySelector(".selected");
const initialActiveFilter = document.getElementById("A");
const likedButton = document.querySelector(".liked-cards-btn");
const pokedexText = document.getElementById("pokedexText");

const cardIncrease = 16;
const cardDecrease = 16;
let currentPage = 1;
let surpriseLoad = false;
let sortClicked = false;
let sortSearch = false;
let searching = false;
let advsearch = false;
let heightFlag = false;
let weightFlag = false;
let count = 0;
let filtercount = 16;
let randPoke = []; // To store random pokemons.
let filtered = []; // To store 16 filtered/searched pokemons at a time.
let filteredPokemons;
let pokemonsWithAbility = [];
let reference = [];
let pokemonsWithHeight;
let pokemonsWithWeight;
let page;
let limit;
let abilityPage;
let filterColor;
let weightColor;
let filterText = [];
let filterTextWeight = [];
let filterHeight;
let filterWeight;
let filteredSearch;
let arrTypes = [];
let arrWeakness = [];
let advPage;
let sortedPokemon;
let ability;
let likedPokemonId = new Set();
let userid;
let likedSpan;

// For advance search.
const advanceSearch = document.querySelector(".advance-search");
const hideSearch = document.querySelector(".hide-advance-search");
const searchBtn = document.querySelector(".btn-search");
const pokedexFilter = document.querySelector(".pokedex-filter-wrapper");
const abilities = document.querySelector("#abilities");
const heightFilter = document.querySelectorAll(".height-size");
const weightFilter = document.querySelectorAll(".weight-size");
const heightShort = document.querySelector(".height-size-short");
const heightAvg = document.querySelector(".height-size-medium");
const heightTall = document.querySelector(".height-size-tall");
const types = document.querySelectorAll(".type");
const weaknessess = document.querySelectorAll(".weakness");

const weightLight = document.querySelector(".weight-size-light");
const weightMed = document.querySelector(".weight-size-med");
const weightHeavy = document.querySelector(".weight-size-heavy");
const reset = document.querySelector(".btn-reset");

// Removing duplicates and merging the attributes.
function mergeDuplicates(data) {
  // New object to store the merged data.
  const unique = {};
  let maxHeight;
  let maxWeight;

  // Iterating through the pokemons array of objects.
  for (const pokemon of data) {
    // Taking id's as unique.
    const id = pokemon.id;

    pokemon.weakness = pokemon.weakness.map((weakness) =>
      weakness.toLowerCase()
    );
    if (!unique[id]) {
      unique[id] = pokemon;
    } else {
      // Merging extra attributes.
      unique[id].type = Array.from(
        new Set([...unique[id].type, ...pokemon.type])
      );

      // Getting the maximum height and weight from the duplicates.
      if (pokemon.height > unique[id].height) {
        maxHeight = Math.max(maxHeight, pokemon.height);
        unique[id].height = pokemon.height;
      }

      if (pokemon.weight > unique[id].weight) {
        maxWeight = Math.max(maxWeight, pokemon.weight);
        unique[id].weight = pokemon.weight;
      }
    }
  }
  // Convert object back to list of unique objects
  const uniqueArrayOfObjects = Object.values(unique);
  return uniqueArrayOfObjects;
}
const uniquePokemons = mergeDuplicates(pokemons);
let uniquePokemons_copy = [...uniquePokemons];

// Function to get random cards.
function getRandomItemNotInDerived(originalArray, derivedArray) {
  // Filtering the original array to find items not present in the derived array
  const itemsNotInDerived = originalArray.filter(
    (item) => !derivedArray.includes(item)
  );

  if (itemsNotInDerived.length > 0) {
    // Generate a random index
    const randomIndex = Math.floor(Math.random() * itemsNotInDerived.length);

    return itemsNotInDerived[randomIndex];
  } else {
    return null;
  }
}

// On click of the "Pokedex" text will redirect you to the home page.
pokedexText.addEventListener("click", async () => {
  count = 0;
  card.innerHTML = "";
  userid = extractUserIdFromURL();
  const likedPokemonsIdsFromDB = await getData(userid);

  addCards(1, false, uniquePokemons_copy);

  for (let i of likedPokemonsIdsFromDB) {
    likedSpan = i - 1;
    const element = document.querySelector(`.pokemon-${likedSpan}`);
    element.classList.toggle("liked");
  }

  loadMore.style.display = "inline";
  collapse.classList.remove("active");
});

// On window load add 16 cards.
window.onload = async function initialLoad() {
  userid = extractUserIdFromURL();
  const likedPokemonsIdsFromDB = await getData(userid);
  addCards(currentPage, surpriseLoad, uniquePokemons_copy);
  for (let i of likedPokemonsIdsFromDB) {
    likedSpan = i - 1;
    const element = document.querySelector(`.pokemon-${likedSpan}`);
    element.classList.toggle("liked");
  }
  const load = loadMore.addEventListener("click", loadMorePokemons);
};

// To load more pokemons.
function loadMorePokemons() {
  if (!searching) {
    if (!advsearch) {
      addCards(
        currentPage + 1,
        surpriseLoad,
        uniquePokemons_copy,
        searching,
        false
      );
    } else if (advsearch) {
      addCards(
        currentPage + 1,
        false,
        pokemonsWithAbility,
        searching,
        advsearch
      );

      if (currentPage === advPage) {
        loadMore.style.display = "none";
      } else {
        loadMore.style.display = "inline";
      }
    }
    collapse.classList.add("active");
  } else {
    addCards(currentPage + 1, surpriseLoad, filteredPokemons, searching, false);
    collapse.classList.add("active");
    if (currentPage === page) {
      loadMore.style.display = "none";
    }
  }
}

// This creates new cards.
function createCard(index2) {
  let index = index2 - 1;
  if (index == -1) {
    index = 0;
  }

  card.innerHTML += `<li id="${index}">
     <img src="${uniquePokemons[index].ThumbnailImage}" alt="${
    uniquePokemons[index].name
  }" class="pokemon-image">
      <div class="pokemon-info">
      <p class="id">#${uniquePokemons[index].number}
      <h4 class="pokemon-name">${uniquePokemons[index].name}</h4>
      </p>
      <div class="pokemon-abilities">
      <span class="material-symbols-outlined like-button pokemon-${index}" onclick="handleLike(${index}, this, ${
    uniquePokemons[index].id
  })">
            favorite
          </span>
      ${uniquePokemons[index].type
        .map(
          (type) =>
            `<span class="pokemon-type background-color-${type}">${type}</span>`
        )
        .join(" ")}

      <p class="pokemon-Height"><b>Height: </b> ${
        uniquePokemons[index].height
      } in</p>
      <p class="pokemon-Weight"><b>Weight: </b> ${
        uniquePokemons[index].weight
      } lbs</p>
     
      </div>
      
      </li>`;
  container.appendChild(card);
}

// Function to save likedPokemonsId for the user
async function saveLikedPokemonsId(userId, likedPokemonsId) {
  try {
    const response = await fetch(`/save-liked-pokemons/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ likedPokemonsId }),
    });

    if (response.ok) {
      console.log("Liked Pokémon IDs saved successfully");
    } else {
      throw new Error("Failed to save liked Pokémon IDs");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

async function getData(userId) {
  try {
    const response = await fetch(`/get-liked-pokemons/${userId}`); // Make a GET request to your backend endpoint

    if (response.ok) {
      const data = await response.json();
      const likedPokemonIds = data.likedPokemonsId;

      return likedPokemonIds;
    } else {
      console.error("Failed to fetch liked Pokemons");
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

// HandleLike function to change the color on click.
async function handleLike(index, span, pokemonId) {
  // Retrieve the userId value
  userid = extractUserIdFromURL();

  const likedPokemonsIdsFromDB = await getData(userid);

  // Check if the current pokemonId is in the likedPokemonsIdsFromDB
  const isLikedFromDB = likedPokemonsIdsFromDB.includes(pokemonId);

  const isLiked = span.classList.toggle("liked");

  if (isLiked) {
    likedPokemonId.add(pokemonId);
    span.style.color = "red"; // Make the span red upon liking
  } else {
    likedPokemonId.delete(pokemonId);

    const indexToRemove = likedPokemonsIdsFromDB.indexOf(pokemonId);
    if (indexToRemove !== -1) {
      likedPokemonsIdsFromDB.splice(indexToRemove, 1);

      if (userid !== null) {
        saveLikedPokemonsId(userid, [
          ...new Set([...likedPokemonsIdsFromDB, ...likedPokemonId]),
        ]);
      } else {
        console.log("User ID not found in URL.");
      }
    }

    span.style.color = "";

    fetchLikedPokemonsId();
  }

  // Save updated likedPokemonsIds to the database
  if (userid !== null) {
    saveLikedPokemonsId(userid, [
      ...new Set([...likedPokemonsIdsFromDB, ...likedPokemonId]),
    ]);
  } else {
    console.log("User ID not found in URL.");
  }
}

// To get the userId from the URL.
function extractUserIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  userid = urlParams.get("userId");
  return userid;
}

// Function to handle the button click event
likedButton.addEventListener("click", fetchLikedPokemonsId);
async function fetchLikedPokemonsId() {
  userid = extractUserIdFromURL();

  if (userid) {
    try {
      const response = await fetch(`/get-liked-pokemons/${userid}`);

      if (response.ok) {
        const data = await response.json();
        const { likedPokemonsId } = data;

        if (likedPokemonsId.length === 0) {
          count = 0;
          card.innerHTML = "";

          addCards(1, false, uniquePokemons_copy);
          loadMore.style.display = "inline";
        } else {
          card.innerHTML = "";
          for (let i of likedPokemonsId) {
            createCard(i);
          }

          for (let i of likedPokemonsId) {
            likedSpan = i - 1;
            const element = document.querySelector(`.pokemon-${likedSpan}`);
            element.classList.toggle("liked");
          }

          loadMore.style.display = "none";
        }
      } else {
        console.error("Failed to fetch liked Pokemons");
      }
    } catch (error) {
      console.error("Error fetching liked Pokemons:", error);
    }
  } else {
    console.log("User ID not found in URL.");
  }
  collapse.classList.remove("active");
}

// This calls a function to add cards.
const cardLimit = uniquePokemons.length - 1;
const pageCount = Math.ceil(cardLimit / cardIncrease);
function addCards(
  pageIndex,
  surprise_Load,
  pokemonCards,
  searching = false,
  advsearch = false
) {
  currentPage = pageIndex;

  const startRange = (pageIndex - 1) * cardIncrease;
  const endRange =
    pageIndex * cardIncrease > cardLimit ? cardLimit : pageIndex * cardIncrease;

  if (!surprise_Load) {
    if (!searching) {
      if (!advsearch) {
        for (let i = startRange; i < endRange; i++) {
          count++;
          const idx = pokemonCards[i].id;
          createCard(idx);
        }
      } else {
        limit = pokemonCards.length;

        const end =
          pageIndex * cardIncrease > limit ? limit : pageIndex * cardIncrease;
        for (let i = startRange; i < end; i++) {
          createCard(pokemonCards[i].id);
        }
      }
    } else {
      limit = pokemonCards.length;

      const end =
        pageIndex * cardIncrease > limit ? limit : pageIndex * cardIncrease;
      for (let i = startRange; i < end; i++) {
        createCard(pokemonCards[i].id);
      }
    }
  } else {
    // Check for filter.
    if (!sortClicked) {
      if (pageIndex === 1) {
        for (let j = startRange; j < endRange; j++) {
          let randomId = getRandomItemNotInDerived(pokemonCards, randPoke);

          if (randomId === null) {
            loadMore.style.display = "none";
          } else {
            randPoke.push(randomId);

            let idx = randomId.id;

            createCard(idx);
          }
        }
      } else {
        for (let j = 0; j < count; j++) {
          let randomId = getRandomItemNotInDerived(pokemonCards, randPoke);

          if (randomId === null) {
            loadMore.style.display = "none";
          } else {
            randPoke.push(randomId);
            let idx = randomId.id;

            createCard(idx);
          }
        }
      }
    } else {
      addCards(currentPage, (surpriseLoad = false), uniquePokemons_copy);
    }
  }
}

// This removes the cards.
function removeCards(cardIndex, surprise_Load, searching) {
  if (!surprise_Load) {
    if (!sortClicked && !searching) {
      const i = document.getElementById(`${cardIndex}`);
      card.removeChild(i);
    } else if (sortClicked && !searching) {
      const idx = uniquePokemons_copy[cardIndex].id - 1;
      const i = document.getElementById(`${idx}`);
      card.removeChild(i);
    } else if (!sortClicked && searching) {
      const i = document.getElementById(`${cardIndex - 1}`);

      card.removeChild(i);
    } else if (sortClicked && searching) {
      const i = document.getElementById(`${cardIndex - 1}`);

      card.removeChild(i);
    }
  } else {
    const idx = randPoke[cardIndex].id - 1;
    const i = document.getElementById(`${idx}`);

    card.removeChild(i);
    randPoke.pop();
  }
}

function removeAdvCards(cardIndex) {
  const i = document.getElementById(`${cardIndex - 1}`);
  card.removeChild(i);
}

// To calls a function to remove cards.
collapse.addEventListener("click", () => {
  collapseCards(currentPage, surpriseLoad, searching, advsearch);
});
function collapseCards(
  index,
  surprise_Load,
  searching = false,
  advsearch = false
) {
  currentPage = index;

  if (currentPage > 1) {
    const startRange = (index - 1) * cardDecrease;
    const endRange =
      index * cardDecrease > cardLimit ? cardLimit : index * cardDecrease;

    if (!surprise_Load) {
      if (!searching) {
        if (!advsearch) {
          for (let i = startRange; i < endRange; i++) {
            count--;
            removeCards(i);
          }
        } else {
          limit = pokemonsWithAbility.length;
          const end =
            index * cardDecrease > limit ? limit : index * cardDecrease;

          for (let i = startRange; i < end; i++) {
            removeAdvCards(pokemonsWithAbility[i].id);
          }
          loadMore.style.display = "inline";
        }
      } else {
        limit = filteredPokemons.length;
        const end = index * cardDecrease > limit ? limit : index * cardDecrease;

        for (let i = startRange; i < end; i++) {
          removeCards(filteredPokemons[i].id, surprise_Load, searching);
        }
        loadMore.style.display = "inline";
      }
    } else {
      for (let i = randPoke.length - 1; i >= startRange; i--) {
        removeCards(i, surprise_Load);
      }
    }

    currentPage -= 1;
  }

  if (currentPage === 1) collapse.classList.remove("active");
}

// Surprise Me.
btnSurprise.addEventListener("click", () => {
  surpriseMe();
});

// To display random cards.
function displaySurprise(count, pokemonCards) {
  sortClicked = false;
  for (let j = 0; j < count; j++) {
    let randomId = getRandomItemNotInDerived(pokemonCards, randPoke);

    if (randomId === null) {
      loadMore.style.display = "none";
    } else {
      randPoke.push(randomId);
      let idx = randomId.id;

      createCard(idx);
    }
  }
  collapse.classList.remove("active");
}

function surpriseMe() {
  randPoke = [];
  surpriseLoad = true;

  // Setting the filter back to initial setting.
  selected.innerText = initialActiveFilter.innerText;
  // Removing active-fiilter class.

  options.forEach((option) => {
    option.classList.remove("active-filter");
  });

  // Adding the active-filter class to the clicked option.
  initialActiveFilter.classList.add("active-filter");

  card.innerHTML = "";

  if (sortClicked) {
    count = 16;
    displaySurprise(count, uniquePokemons_copy);
  } else {
    addCards(currentPage, surpriseLoad, uniquePokemons_copy);
  }
}

// Search textarea.
userInput.addEventListener("keyup", handleSearch);

// To search by name/number.
function handleSearch() {
  searching = true;
  sortSearch = true;
  const searchItem = userInput.value.toLowerCase();

  if (!searchItem.length) {
    collapse.classList.remove("active");
    searching = false;
    count = 16;
    uniquePokemons_copy.sort((a, b) => a.id - b.id);
    sortSearch = false;
    notFoundMessage.style.display = "none";
    card.innerHTML = "";

    selected.innerText = initialActiveFilter.innerText;

    // Removing active-fiilter class.
    options.forEach((option) => {
      option.classList.remove("active-filter");
    });

    // Adding the active-filter class to the clicked option.
    initialActiveFilter.classList.add("active-filter");

    if (count <= 16) collapse.classList.remove("active");
    else collapse.classList.add("active");

    if (!surpriseLoad) {
      if (!advsearch) {
        for (let i = 0; i < count; i++) {
          createCard(i + 1);
        }
      } else {
        if (pokemonsWithAbility.length < 16) {
          for (let i = 0; i < pokemonsWithAbility.length; i++) {
            createCard(pokemonsWithAbility[i].id);
          }

          loadMore.style.display = "none";
          collapse.classList.remove("active");
        } else {
          addCards(1, false, pokemonsWithAbility, searching, advsearch);
          loadMore.style.display = "inline";
        }
      }
    } else {
      loadMore.style.display = "inline";
      surpriseMe();
    }
    collapse.classList.remove(".active");
  } else {
    if (isFinite(searchItem)) {
      if (!advsearch) {
        filteredPokemons = uniquePokemons_copy.filter((pokemon) => {
          let pokemonNumber = parseInt(pokemon.number);
          let searchItm = parseInt(searchItem);
          return pokemonNumber.toString().startsWith(searchItm.toString());
        });
      } else {
        filteredPokemons = pokemonsWithAbility.filter((pokemon) => {
          let pokemonNumber = parseInt(pokemon.number);
          let searchItm = parseInt(searchItem);
          return pokemonNumber.toString().startsWith(searchItm.toString());
        });
      }
    } else {
      if (!advsearch) {
        filteredPokemons = uniquePokemons_copy.filter((pokemon) => {
          return pokemon.name.toLowerCase().startsWith(searchItem);
        });
      } else {
        filteredPokemons = pokemonsWithAbility.filter((pokemon) => {
          return pokemon.name.toLowerCase().startsWith(searchItem);
        });
      }

      if (filteredPokemons.length < 16) {
        loadMore.style.display = "none";
        collapse.classList.remove("active");
      }
    }

    card.innerHTML = "";

    page = Math.ceil(filteredPokemons.length / 16);

    if (filteredPokemons.length <= 16) {
      currentPage = 1;
      loadMore.style.display = "none";
      collapse.classList.remove("active");
      for (let i = 0; i < filteredPokemons.length; i++) {
        createCard(filteredPokemons[i].id);
      }
    } else {
      addCards(1, surpriseLoad, filteredPokemons, searching);
    }

    sorting(filteredPokemons, sortSearch);

    if (filteredPokemons.length === 0) {
      notFoundMessage.style.display = "block";
      loadMore.style.display = "none";
      collapse.classList.remove("active");
    } else {
      notFoundMessage.style.display = "none";
      if (filteredPokemons.length > 16) loadMore.style.display = "inline";
      else loadMore.style.display = "none";
    }

    collapse.classList.remove("active");
  }

  sortSearch = false;
}

//Dropdown Menu for filter.
select.addEventListener("click", () => {
  menu.classList.toggle("menu-open");
  sorting();
});

// To select the sorting filter.
function sorting() {
  options.forEach((option) => {
    option.addEventListener("click", () => {
      if (!searching && !advsearch)
        sortPokemon(option.id, uniquePokemons_copy, false);
      else {
        loadMore.style.display = "none";
        if (searching && !advsearch)
          sortPokemon(option.id, filteredPokemons, true);
        else {
          sortPokemon(option.id, pokemonsWithAbility, sortSearch);
        }
      }

      // This changes the inner text for the "Sort By".
      selected.innerText = option.innerText;

      // Rolling back the menu.
      menu.classList.remove("menu-open");

      // Removing active-fiilter class.
      options.forEach((option) => {
        option.classList.remove("active-filter");
      });

      // Adding the active-filter class to the clicked option.
      option.classList.add("active-filter");
    });
  });
}

// Sorting Function.
function sortPokemon(sortId, pokemonCards, sortSearch) {
  sortClicked = true;
  // Sorting from Low-to-High (Number).
  sortedPokemon = pokemonCards.sort((a, b) => a.id - b.id);
  if (sortId === "A") {
    card.innerHTML = "";

    collapse.classList.remove("active");

    if (!sortSearch) displaySorted(sortedPokemon);
    else displaySortedSearch(sortedPokemon);
  }

  // Sorting from High-to-Low (Number).
  else if (sortId === "B") {
    card.innerHTML = "";
    sortedPokemon = pokemonCards.sort((a, b) => b.id - a.id);
    collapse.classList.remove("active");

    if (!sortSearch) displaySorted(sortedPokemon);
    else displaySortedSearch(sortedPokemon);
  }
  // Sorting from A-Z.
  else if (sortId === "C") {
    card.innerHTML = "";
    sortedPokemon = pokemonCards.sort((a, b) => a.name.localeCompare(b.name));

    collapse.classList.remove("active");

    if (!sortSearch) displaySorted(sortedPokemon);
    else displaySortedSearch(sortedPokemon);
  }
  // Sorting from Z-A.
  else {
    card.innerHTML = "";
    sortedPokemon = pokemonCards.sort((a, b) => b.name.localeCompare(a.name));

    collapse.classList.remove("active");

    if (!sortSearch) displaySorted(sortedPokemon);
    else displaySortedSearch(sortedPokemon);
  }
}

// To display filtered/sorted cards.
function displaySorted(sortedPokemon) {
  const pokemons = sortedPokemon;

  if (!advsearch) {
    if (filtercount > 16) {
      loadMore.style.display = "inline";
      collapse.classList.add("active");
      for (let i = 0; i < count; i++) {
        createCard(pokemons[i].id);
      }
    } else {
      loadMore.style.display = "inline";
      collapse.classList.remove("active");
      for (let i = 0; i < count; i++) {
        createCard(pokemons[i].id);
      }
    }
  } else {
    if (sortedPokemon.length > 16) {
      loadMore.style.display = "inline";
      collapse.classList.add("active");
      for (let i = 0; i < count; i++) {
        createCard(pokemons[i].id);
      }
    } else {
      loadMore.style.display = "none";
      collapse.classList.remove("active");
      for (let i = 0; i < sortedPokemon.length; i++) {
        createCard(pokemons[i].id);
      }
    }
  }
  sortSearch = false;
}

function displaySortedSearch(sortedPokemon) {
  if (filtercount > 16) {
    loadMore.style.display = "inline";
    collapse.classList.add("active");
    for (let i = 0; i < count; i++) {
      createCard(sortedPokemon[i].id);
    }
  } else {
    if (filtercount < 16) {
      loadMore.style.display = "none";
      currentPage = 1;
    } else {
      loadMore.style.display = "inline";
      collapse.classList.remove("active");
      for (let i = 0; i < count; i++) {
        createCard(sortedPokemon[i].id);
      }
    }
  }
}

// Hide advance search.
hideSearch.addEventListener("click", hideAdvanceSearch);
function hideAdvanceSearch() {
  pokedexFilter.style.height = "0";

  advanceSearch.style.display = "block";
  hideSearch.style.display = "none";
}

// To display the filtered cards from advance search.
function displayFiltered(pokeCards) {
  card.innerHTML = "";

  for (let i = 0; i < pokeCards.length; i++) {
    createCard(pokeCards[i].id);
  }
  loadMore.style.display = "none";
}

advanceSearch.addEventListener("click", openAdvanceSearch);
function openAdvanceSearch() {
  pokemonsWithAbility = [];
  notFoundMessage.style.display = "none";
  pokedexFilter.style.height = "inherit";
  advanceSearch.style.display = "none";
  hideSearch.style.display = "block";
  populateAbilities();

  function populateAbilities(poke = uniquePokemons_copy) {
    const abilitiesSet = new Set();

    // Extract unique abilities from the pokemons array
    poke.forEach((pokemon) => {
      pokemon.abilities.forEach((ability) => {
        abilitiesSet.add(ability);
      });
    });

    // Add unique abilities as options to the select dropdown
    abilitiesSet.forEach((ability) => {
      const option = document.createElement("option");
      option.value = ability;
      option.text = ability;
      abilities.appendChild(option);
    });
  }

  // To select the height.
  function selectHeight() {
    if (
      heightShort.style.background === "crimson" &&
      heightAvg.style.background === "crimson" &&
      heightTall.style.background === "crimson"
    ) {
      filterHeight = "all";
    } else if (
      heightShort.style.background === "" &&
      heightAvg.style.background === "" &&
      heightTall.style.background === ""
    ) {
      filterHeight = "none";
    } else if (
      heightShort.style.background === "crimson" &&
      heightAvg.style.background === "crimson"
    ) {
      filterHeight = "shortavg";
    } else if (
      heightAvg.style.background === "crimson" &&
      heightTall.style.background === "crimson"
    ) {
      filterHeight = "avgtall";
    } else if (
      heightShort.style.background === "crimson" &&
      heightTall.style.background === "crimson"
    ) {
      filterHeight = "shorttall";
    } else if (heightShort.style.background === "crimson") {
      filterHeight = "short";
    } else if (heightAvg.style.background === "crimson") {
      filterHeight = "med";
    } else if (heightTall.style.background === "crimson") {
      filterHeight = "tall";
    }
  }

  // Adding event listener to the height filter to change the color on click.
  heightShort.addEventListener("click", () => {
    if (heightShort.style.background === "crimson")
      heightShort.style.background = "";
    else heightShort.style.background = "crimson";
  });

  heightAvg.addEventListener("click", () => {
    if (heightAvg.style.background === "crimson")
      heightAvg.style.background = "";
    else heightAvg.style.background = "crimson";
  });

  heightTall.addEventListener("click", () => {
    if (heightTall.style.background === "crimson")
      heightTall.style.background = "";
    else heightTall.style.background = "crimson";
  });

  // For weight
  function selectWeight() {
    if (
      weightLight.style.background === "crimson" &&
      weightMed.style.background === "crimson" &&
      weightHeavy.style.background === "crimson"
    ) {
      filterWeight = "all";
    } else if (
      weightLight.style.background === "" &&
      weightMed.style.background === "" &&
      weightHeavy.style.background === ""
    ) {
      filterWeight = "none";
    } else if (
      weightLight.style.background === "crimson" &&
      weightMed.style.background === "crimson"
    ) {
      filterWeight = "lightmed";
    } else if (
      weightMed.style.background === "crimson" &&
      weightHeavy.style.background === "crimson"
    ) {
      filterWeight = "medheavy";
    } else if (
      weightLight.style.background === "crimson" &&
      weightHeavy.style.background === "crimson"
    ) {
      filterWeight = "lightheavy";
    } else if (weightLight.style.background === "crimson") {
      filterWeight = "light";
    } else if (weightMed.style.background === "crimson") {
      filterWeight = "med";
    } else if (weightHeavy.style.background === "crimson") {
      filterWeight = "heavy";
    }
  }

  // Adding event listener to the weight filter to change the color on click.
  weightLight.addEventListener("click", () => {
    if (weightLight.style.background === "crimson")
      weightLight.style.background = "";
    else weightLight.style.background = "crimson";
  });

  weightMed.addEventListener("click", () => {
    if (weightMed.style.background === "crimson")
      weightMed.style.background = "";
    else weightMed.style.background = "crimson";
  });

  weightHeavy.addEventListener("click", () => {
    if (weightHeavy.style.background === "crimson")
      weightHeavy.style.background = "";
    else weightHeavy.style.background = "crimson";
  });

  // Type select.
  types.forEach((type) => {
    type.addEventListener("click", function () {
      const value = type.getAttribute("data-value");

      if (type.style.background !== "red") {
        arrTypes.push(value);
        type.style.background = "red";
      } else {
        arrTypes = arrTypes.filter((item) => item !== value);
        type.style.background = "white";
      }
    });
  });

  // Weakness Select
  weaknessess.forEach((weakness) => {
    weakness.addEventListener("click", function () {
      const value = weakness.getAttribute("data-value");

      if (weakness.style.background !== "red") {
        arrWeakness.push(value);
        weakness.style.background = "red";
      } else {
        arrWeakness = arrWeakness.filter((item) => item !== value);
        weakness.style.background = "white";
      }
    });
  });

  searchBtn.addEventListener("click", () => {
    sortSearch = true;
    advsearch = true;
    surpriseLoad = false;
    selectHeight();
    selectWeight();

    pokemonsWithAbility = [];

    ability = abilities.options[abilities.selectedIndex].text;

    if (ability === "All") {
      for (let i = 0; i < uniquePokemons_copy.length; i++) {
        pokemonsWithAbility.push(uniquePokemons_copy[i]);
      }
    } else {
      for (let i = 0; i < uniquePokemons_copy.length; i++) {
        if (uniquePokemons_copy[i].abilities.includes(ability)) {
          pokemonsWithAbility.push(uniquePokemons_copy[i]);
        }
      }
    }

    // To filter based on Types.
    if (arrTypes.length > 0) {
      filteredSearch = pokemonsWithAbility;

      pokemonsWithAbility = [];
      for (const pokemon of filteredSearch) {
        if (arrTypes.every((type) => pokemon.type.includes(type))) {
          pokemonsWithAbility.push(pokemon);
        }
      }
    }

    // To filter based on Weaknesses.
    if (arrWeakness.length > 0) {
      filteredSearch = pokemonsWithAbility;
      pokemonsWithAbility = [];
      for (const pokemon of filteredSearch) {
        if (
          arrWeakness.every((weakness) => pokemon.weakness.includes(weakness))
        ) {
          pokemonsWithAbility.push(pokemon);
        }
      }
    }

    // To filter Height.
    if (filterHeight === "all" || filterHeight === "none") {
      pokemonsWithAbility;
    } else if (filterHeight === "shortavg") {
      filteredSearch = pokemonsWithAbility;

      pokemonsWithAbility = [];

      for (let i = 0; i < filteredSearch.length; i++) {
        if (filteredSearch[i].height < 500) {
          pokemonsWithAbility.push(filteredSearch[i]);
        }
      }
    } else if (filterHeight === "avgtall") {
      filteredSearch = pokemonsWithAbility;

      pokemonsWithAbility = [];

      for (let i = 0; i < filteredSearch.length; i++) {
        if (filteredSearch[i].height > 50) {
          pokemonsWithAbility.push(filteredSearch[i]);
        }
      }
    } else if (filterHeight === "shorttall") {
      filteredSearch = pokemonsWithAbility;

      pokemonsWithAbility = [];

      for (let i = 0; i < filteredSearch.length; i++) {
        if (filteredSearch[i].height < 50 || filteredSearch[i].height > 500) {
          pokemonsWithAbility.push(filteredSearch[i]);
        }
      }
    } else if (filterHeight === "short") {
      filteredSearch = pokemonsWithAbility;

      pokemonsWithAbility = [];

      for (let i = 0; i < filteredSearch.length; i++) {
        if (filteredSearch[i].height < 50) {
          pokemonsWithAbility.push(filteredSearch[i]);
        }
      }
    } else if (filterHeight === "med") {
      filteredSearch = pokemonsWithAbility;

      pokemonsWithAbility = [];

      for (let i = 0; i < filteredSearch.length; i++) {
        if (filteredSearch[i].height > 50 && filteredSearch[i].height < 500) {
          pokemonsWithAbility.push(filteredSearch[i]);
        }
      }
    } else if (filterHeight === "tall") {
      filteredSearch = pokemonsWithAbility;

      pokemonsWithAbility = [];

      for (let i = 0; i < filteredSearch.length; i++) {
        if (filteredSearch[i].height > 500) {
          pokemonsWithAbility.push(filteredSearch[i]);
        }
      }
    }

    // To filter Weight.
    if (filterWeight === "all" || filterWeight === "none") {
      pokemonsWithAbility;
    } else if (filterWeight === "lightmed") {
      filteredSearch = pokemonsWithAbility;

      pokemonsWithAbility = [];

      for (let i = 0; i < filteredSearch.length; i++) {
        if (filteredSearch[i].weight < 500) {
          pokemonsWithAbility.push(filteredSearch[i]);
        }
      }
    } else if (filterWeight === "medheavy") {
      filteredSearch = pokemonsWithAbility;

      pokemonsWithAbility = [];

      for (let i = 0; i < filteredSearch.length; i++) {
        if (filteredSearch[i].weight > 50) {
          pokemonsWithAbility.push(filteredSearch[i]);
        }
      }
    } else if (filterWeight === "lightheavy") {
      filteredSearch = pokemonsWithAbility;

      pokemonsWithAbility = [];

      for (let i = 0; i < filteredSearch.length; i++) {
        if (filteredSearch[i].weight < 50 || filteredSearch[i].weight > 500) {
          pokemonsWithAbility.push(filteredSearch[i]);
        }
      }
    } else if (filterWeight === "light") {
      filteredSearch = pokemonsWithAbility;

      pokemonsWithAbility = [];

      for (let i = 0; i < filteredSearch.length; i++) {
        if (filteredSearch[i].weight < 50) {
          pokemonsWithAbility.push(filteredSearch[i]);
        }
      }
    } else if (filterWeight === "med") {
      filteredSearch = pokemonsWithAbility;

      pokemonsWithAbility = [];

      for (let i = 0; i < filteredSearch.length; i++) {
        if (filteredSearch[i].weight > 50 && filteredSearch[i].weight < 500) {
          pokemonsWithAbility.push(filteredSearch[i]);
        }
      }
    } else if (filterWeight === "heavy") {
      filteredSearch = pokemonsWithAbility;

      pokemonsWithAbility = [];

      for (let i = 0; i < filteredSearch.length; i++) {
        if (filteredSearch[i].weight > 500) {
          pokemonsWithAbility.push(filteredSearch[i]);
        }
      }
    }

    card.innerHTML = "";
    advPage = Math.ceil(pokemonsWithAbility.length / 16);

    if (pokemonsWithAbility.length <= 16) {
      for (let i = 0; i < pokemonsWithAbility.length; i++) {
        createCard(pokemonsWithAbility[i].id);
      }

      loadMore.style.display = "none";
      collapse.classList.remove("active");
    } else {
      addCards(1, false, pokemonsWithAbility, searching, advsearch);
    }

    sorting(pokemonsWithAbility, sortSearch);

    if (pokemonsWithAbility.length === 0) {
      hideAdvanceSearch();
      notFoundMessage.style.display = "block";
      loadMore.style.display = "none";
      collapse.classList.remove("active");
    } else {
      notFoundMessage.style.display = "none";
      if (pokemonsWithAbility.length > 16) loadMore.style.display = "inline";
      else loadMore.style.display = "none";
    }
    sortSearch = false;
  });
}

// Reset button function.
reset.addEventListener("click", () => {
  advsearch = false;
  sortSearch = false;
  searching = false;
  pokemonsWithAbility = uniquePokemons_copy;
  arrTypes = [];
  arrWeakness = [];
  filterHeight = "";
  filterWeight = "";
  abilities.value = "All";

  // Types reset
  types.forEach((type) => {
    type.style.background = "white";
  });

  // Weakness reset
  weaknessess.forEach((weakness) => {
    weakness.style.background = "white";
  });

  // Height reset
  heightFilter.forEach((height) => (height.style.background = ""));

  // Weight reset
  weightFilter.forEach((weight) => (weight.style.background = ""));
});
