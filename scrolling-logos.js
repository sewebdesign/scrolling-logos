document.addEventListener("DOMContentLoaded", function () {
   // Keep track of scroller states and cache width calculations
   const scrollerStates = new Map();
   const widthCache = new WeakMap();

   // Get cached metrics for an item or calculate and cache them if not exists
   function getItemMetrics(item) {
     if (!widthCache.has(item)) {
       const rect = item.getBoundingClientRect();
       const style = getComputedStyle(item);
       const metrics = {
         width: rect.width,
         marginLeft: parseFloat(style.marginLeft),
         marginRight: parseFloat(style.marginRight)
       };
       widthCache.set(item, metrics);
       return metrics;
     }
     return widthCache.get(item);
   }

   // Convert images to background images on parent elements for better performance
   function setInitialBackgrounds(scroller) {
     const items = scroller.querySelectorAll("img");
     items.forEach((image) => {
       if (image) {
         const parent = image.parentElement;
         const activeSrc = image.currentSrc || image.src;
         if (activeSrc && parent) {
           parent.style.backgroundImage = `url('${activeSrc}')`;
           image.style.visibility = "hidden";
         }
       }
     });
   }

   function applyScrollProperties(scroller) {
     if (scroller) {
       // Get original items by filtering out duplicates we created
       const originalItems = Array.from(scroller.children).filter(
         (child) => !child.hasAttribute("aria-hidden")
       );

       // Calculate total width needed for one complete set
       const setWidth = originalItems.reduce((sum, item) => {
         const style = getComputedStyle(item);
         const margin = parseFloat(style.marginLeft) + parseFloat(style.marginRight);
         return sum + item.offsetWidth + margin;
       }, 0);

       // Store set width as CSS variable for animation calculations
       scroller.style.setProperty("--scroller-set-width", setWidth);

       // Calculate sets needed based on container width
       const scrollerWidth = scroller.parentElement.offsetWidth;
       const totalSets = Math.ceil(scrollerWidth / setWidth);
       const prevTotalSets = scrollerStates.get(scroller);

       // Skip DOM updates if number of sets hasn't changed
       if (prevTotalSets === totalSets) {
         return;
       }

       // Use DocumentFragment for efficient DOM manipulation
       const fragment = document.createDocumentFragment();

       // Add original items first
       originalItems.forEach(item => {
         fragment.appendChild(item);
       });

       // Add required number of duplicate sets
       for (let i = 0; i < totalSets; i++) {
         originalItems.forEach(item => {
           const duplicate = item.cloneNode(true);
           duplicate.setAttribute("aria-hidden", "true");
           fragment.appendChild(duplicate);
         });
       }

       // Update DOM in single operation
       scroller.innerHTML = "";
       scroller.appendChild(fragment);

       // Add initialization flag for CSS transitions
       if (!scroller.hasAttribute("data-scroller-scrolling")) {
         scroller.setAttribute("data-scroller-scrolling", "true");
       }
       scrollerStates.set(scroller, totalSets);
     }
   }

   // Initialize all scrollers found on the page
   function initializeScrollers() {
     const scrollers = document.querySelectorAll('.user-items-list[data-space-below-section-title-value="91"] .user-items-list-simple');
     
     // If no scrollers found, don't set up resize listener
     if (!scrollers.length) {
       return null;
     }
     
     scrollers.forEach(scroller => {
       setInitialBackgrounds(scroller);
       applyScrollProperties(scroller);
     });
     return scrollers;
   }

   // Debounce function to limit resize calculations
   function debounce(func, delay) {
     let timer;
     return (...args) => {
       clearTimeout(timer);
       timer = setTimeout(() => func(...args), delay);
     };
   }

   const scrollers = initializeScrollers();

   // Only add resize listener if scrollers exist
   if (scrollers) {
     const handleResize = debounce(() => {
       scrollers.forEach((scroller) => {
         applyScrollProperties(scroller);
       });
     }, 300);
     
     window.addEventListener("resize", handleResize);
   }
});
