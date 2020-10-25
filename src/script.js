'use strict';

const reviews = {
  1: ['abc', 'cde', 'efg'],
  2: ['bc', 'de', 'fg'],
  3: ['ac', 'ce', 'eg'],
  4: ['ab', 'cd', 'ef'],
  5: ['abcr', 'cdeq', 'efgf'],
}

const people = document.querySelectorAll('.team2__people img');
people.forEach((e) => {
  let template = '';
  reviews[e.dataset.staff].forEach((s) => {
    template += '<div class="review">' + s.toString() + '</div>';
  });
  const options = {
    'html': true,
    'content': template,
    'placement': 'top',
    'title': 'Reviews'
  };
  new bootstrap.Popover(e, options);
});

document.addEventListener("click", function (e) {
  people.forEach((e2) => {
    if (e2 !== e.target) {
      bootstrap.Popover.getInstance(e2).hide();
    }
  });
});
