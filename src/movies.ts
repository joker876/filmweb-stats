import axios from 'axios';
import fs from 'fs';
import fsExtra from 'fs-extra';
import { ids } from './data';

async function fetchMovieData(id: string) {
  const res = await axios.get(`https://www.filmweb.pl/api/v1/film/${id}/preview`, {
    headers: {
      'X-Locale': 'pl_PL',
    },
  });
  return res.data;
}
async function fetchMovieDuration(id: string) {
  const data = await fetchMovieData(id);
  return { title: (data.title ?? data.originalTitle).title, duration: data.duration };
}

export async function generateMovieData() {
  let totalDurations = 0;
  const infos = [];
  for (let i = 0; i < ids.length; i++) {
    // for (let i = 0; i < 3; i++) {
    const id = ids[i];
    const info = await fetchMovieDuration(id);
    infos.push(info);
    totalDurations += info.duration;
    console.log(info.title);

    infos.sort((a, b) => b.duration - a.duration);

    fsExtra.ensureDirSync('out/');
    fs.writeFileSync('out/movies.json', JSON.stringify({ total: totalDurations, movies: infos }, null, 2));
  }
  console.log(totalDurations / 60);
}
