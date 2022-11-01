/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('playlists', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    name: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    owner: {
      type: 'VARCHAR(50)',
    },
  });

  pgm.createTable('playlist_songs', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    playlist_id: {
      type: 'VARCHAR(50)',
    },
    song_id: {
      type: 'VARCHAR(50)',
    },
  });

  // memberikan constraint foreign key pada owner terhadap kolom id dari tabel users
  pgm.addConstraint('playlists', 'fk_playlists.owner_users.id', 'FOREIGN KEY(owner) REFERENCES users(id) ON DELETE CASCADE');

  // memberikan constraint foreign key pada playlist_id terhadap kolom id dari tabel palylist
  pgm.addConstraint('playlist_songs', 'fk_playlist_songs.playlist_id_playlists.id', 'FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE');

  // memberikan constraint foreign key pada song_id terhadap kolom id dari tabel songs
  pgm.addConstraint('playlist_songs', 'fk_playlist_songs.song_id_songs.id', 'FOREIGN KEY(song_id) REFERENCES songs(id) ON DELETE CASCADE');
};

exports.down = (pgm) => {
  // menghapus constraint fk_playlist_songs.song_id_songs.id pada tabel playlist_songs
  pgm.dropConstraint('playlist_songs', 'fk_playlist_songs.song_id_songs.id');

  // menghapus constraint fk_playlist_songs.playlist_id_playlists.id pada tabel playlist_songs
  pgm.dropConstraint('playlist_songs', 'fk_playlist_songs.playlist_id_playlists.id');

  // menghapus constraint fk_playlists.owner_users.id pada tabel playlists
  pgm.dropConstraint('playlists', 'fk_playlists.owner_users.id');

  pgm.dropTable('playlists');
  pgm.dropTable('playlist_songs');
};
