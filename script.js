const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const start = 1946;
const yearNb = new Date().getFullYear() - start - 1;
// const yearNb = 10;

const DATA = {}
const DELTA = []

const init = async () => {
  const array = Array.from({ length: yearNb }, (v, k) => k + start)

  for (const year of array) {
    await getYearStandings(year)
  }

  fs.writeFileSync('STANDINGS.json', JSON.stringify(DATA, null, 2))

  const sortedDelta = DELTA.sort((a,b) => {
    return b.delta > a.delta ? 1 : -1;
  })
  fs.writeFileSync('DELTA.json', JSON.stringify(sortedDelta, null, 2))
}

const fetchData = async (year) => {
  const end = (year + 1).toString().substr(2, 2)
  const url = `https://en.wikipedia.org/wiki/${year}-${end}_NBA_season#Regular_season`;
  console.log(url)
  const result = await axios.get(url);
  return cheerio.load(result.data);
};

const PREV_VALUES = {}

const getYearStandings = async (year) => {
  const $ = await fetchData(year);

  const CONTEXTS = [
    $('.wikitable[width="400px"] tbody tr'),
    $('.wikitable[width="60%"] tbody tr'),
    $('.wikitable[width="80%"] tbody tr'),
    $('.wikitable[width="470"] tbody tr'),
  ]

  CONTEXTS.map(ctx => {
    ctx.each((_, element) => {
      let name;
      let wins;
      let delta;

      const DONE = []
      const team = $(element).find('td a').attr('href')
      if (team) {
        const split = team.split('_')
        name = split.splice(1, split.length - 2).join(' ')
      }

      $(element).find('td').each((index, td) => {
        if (td.children && td.children.length && index === 1) {
          wins = parseInt(td.children[0].data.replace('\n', ''), 10)
        }
      })

      // if (name && wins && DONE.indexOf(name) === -1) {
      if (name && wins) {

        if (!DATA[name]) {
          DATA[name] = []
        }

        if (PREV_VALUES[name]) {
          delta = wins - PREV_VALUES[name]

          DELTA.push({
            team: name,
            wins,
            previous: PREV_VALUES[name],
            delta,
            year,
          })
        }

        DATA[name].push({
          year,
          wins,
          delta
        })


        PREV_VALUES[name] = wins;
        DONE.push(name)
      }
    });
  })
}

// Launch
init()
