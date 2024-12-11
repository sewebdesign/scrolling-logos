document.addEventListener("DOMContentLoaded", function () {
  const scrollerStates = new Map();

  // Function to set background from srcset or src on page load
  function setInitialBackgrounds(scroller) {
    const items = scroller.querySelectorAll("img");
    items.forEach((image) => {
      if (image) {
        const parent = image.parentElement;
        const activeSrc = image.currentSrc || image.src;
        if (activeSrc && parent) {
          parent.style.backgroundImage = `url('${activeSrc}')`;
          image.style.visibility = "hidden"; // Hide the original image
        }
      }
    });
  }

  function applyScrollProperties(scroller) {
    if (scroller) {
      
      //Just get original items: filter out duplicates
      const originalItems = Array.from(scroller.children).filter(
        (child) => !child.hasAttribute("aria-hidden")
      );

      //Calculate original set width
      const setWidth = originalItems.reduce((sum, item) => {
        const style = getComputedStyle(item);
        const margin = parseFloat(style.marginLeft) + parseFloat(style.marginRight);
        return sum + item.offsetWidth + margin;
      }, 0);
      
      //Add original set width to CSS for calculations
      scroller.style.setProperty("--scroller-set-width", setWidth);
      
      //Calculate parent width and number of sets needed to fill it
      const scrollerWidth = scroller.parentElement.offsetWidth;
      const totalSets = Math.ceil(scrollerWidth / setWidth);

      const prevTotalSets = scrollerStates.get(scroller);

      //Do nothing if number of sets hasn't changed
      if (prevTotalSets === totalSets) {
        return;
      }
      
      //If number of sets changes, clear items and re-add necessary duplicate sets
      scroller.innerHTML = "";
      originalItems.forEach((item) => scroller.appendChild(item));

      for (let i = 0; i < totalSets; i++) {
        originalItems.forEach((item) => {
          const duplicate = item.cloneNode(true);
          duplicate.setAttribute("aria-hidden", "true");
          scroller.appendChild(duplicate);
        });
      }
      
      //Add data attribute to show logos once initialized
      if (!scroller.hasAttribute("data-scroller-scrolling")) {
        scroller.setAttribute("data-scroller-scrolling", "true");
      }

      scrollerStates.set(scroller, totalSets);
    }
  }
  
  //Run set-up functions for all scrollers
  function initializeScrollers() {
    const scrollers = document.querySelectorAll('.user-items-list[data-space-below-section-title-value="91"] .user-items-list-simple');
    scrollers.forEach((scroller) => {
      setInitialBackgrounds(scroller);
      applyScrollProperties(scroller);
    });
    return scrollers;
  }

  // Debounce function for efficient resize handling
  function debounce(func, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  }

  // Initialize all scrollers on DOMContentLoaded
  const scrollers = initializeScrollers();

  // Handle screen resizing with optimized logic
  const handleResize = debounce(() => {
   // console.log("Resize finished. Recalculating...");
    scrollers.forEach((scroller) => {
      const originalItems = Array.from(scroller.children).filter(
        (child) => !child.hasAttribute("aria-hidden")
      );
      applyScrollProperties(scroller, originalItems);
    });
  }, 300);

  window.addEventListener("resize", handleResize);
});
