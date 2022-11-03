const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapDBToModel } = require('../../utils/albums');

class AlbumsService {
  constructor(songsService, cacheService) {
    this._pool = new Pool();
    this._songsService = songsService;
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = nanoid(16);

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbums() {
    const result = await this._pool.query('SELECT * FROM albums');
    return result;
  }

  async getAlbumById(id) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }
    const album = result.rows.map(mapDBToModel)[0];
    album.songs = await this._songsService.getSongByAlbumId(id);
    return album;
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }

  async addCoverAlbum(id, coverUrl) {
    const query = {
      text: 'UPDATE albums SET cover_url = $1 WHERE id = $2 RETURNING id',
      values: [coverUrl, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal menambahkan cover album. Id tidak ditemukan');
    }
  }

  async postLikeAlbum(albumId, userId) {
    const query = {
      text: 'SELECT * FROM user_album_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, userId],
    };
    const result = await this._pool.query(query);
    let message = '';
    if (!result.rows.length) {
      const id = nanoid(16);
      const queryLike = {
        text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
        values: [id, userId, albumId],
      };
      const post = await this._pool.query(queryLike);
      if (!post.rows.length) {
        throw new NotFoundError('Album gagal disukai');
      }
      message = 'Album berhasil disukai';
    } else {
      const { id } = result.rows[0];
      const queryDislike = {
        text: 'DELETE FROM user_album_likes WHERE id = $1 RETURNING id',
        values: [id],
      };
      const post = await this._pool.query(queryDislike);
      if (!post.rows.length) {
        throw new NotFoundError('Album gagal batal disukai');
      }
      message = 'Album berhasil batal disukai';
    }
    await this._cacheService.delete(`albumLikes:${albumId}`);

    return message;
  }

  async getAlbumLikes(albumId) {
    try {
      // mendapatkan catatan dari cache
      const result = await this._cacheService.get(`albumLikes:${albumId}`);

      const album = {};
      album.like = JSON.parse(result);
      album.cache = true;

      return album;
    } catch (error) {
      const query = {
        text: 'SELECT COUNT(*) FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };
      const result = await this._pool.query(query);

      if (!result.rows.length) {
        throw new NotFoundError('Album tidak ditemukan');
      }
      const count = parseInt(result.rows[0].count, 10);

      // catatan akan disimpan pada cache sebelum fungsi getNotes dikembalikan
      await this._cacheService.set(`albumLikes:${albumId}`, JSON.stringify(count));

      return count;
    }
  }
}

module.exports = AlbumsService;
