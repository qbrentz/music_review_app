import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Table, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function Dashboard() {
  const [userData, setMyUserData] = useState([])
  const [myReviews, setMyReviews] = useState([]);
  const [randomReviews, setRandomReviews] = useState([]);
  const [albumsDB, setAlbumsDB] = useState([]);
  const [songsDB, setSongsDB] = useState([]);
  const [expandedAlbumId, setExpandedAlbumId] = useState(null);
  const [albumPage, setAlbumPage] = useState(1);
  const [totalAlbums, setTotalAlbums] = useState(0);
  const [playlists, setPlaylists] = useState([]);
  const albumsPerPage = 5;

  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };
  
  useEffect(() => {

    const fetchPlaylistsWithSongs = async () => {
      const { data: playlistsData, error: playlistsError } = await supabase
        .from('playlist')
        .select('playlist_id, name, link');
  
      if (playlistsError) {
        console.error(playlistsError);
        return;
      }
  
      // Fetch all Playlist_Song mappings + song info
      const { data: playlistSongsData, error: psError } = await supabase
        .from('playlist_song')
        .select('playlist_id, song:song_id(title, artist, genre, duration)');
  
      if (psError) {
        console.error(psError);
        return;
      }
  
      // Group songs by playlist
      const playlistMap = {};
      playlistsData.forEach((pl) => {
        playlistMap[pl.playlist_id] = { ...pl, songs: [] };
      });
  
      playlistSongsData.forEach((ps) => {
        if (playlistMap[ps.playlist_id]) {
          playlistMap[ps.playlist_id].songs.push(ps.song);
        }
      });
  
      setPlaylists(Object.values(playlistMap));
    };
  
    

    const fetchUserData = async () =>{
      const { data: userData } = await supabase.from('User')
      .select('*');
      setMyUserData(userData || []);
    }

    
    const fetchReviews = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: myData } = await supabase
        .from('rating')
        .select(`*,
          User(*),
          song(*),
          album(*),
          playlist(*)`)
          .eq('user_id', userData.user_id);
        

      const { data: randomData } = await supabase
        .from('rating')
        .select(`*,
          song(*),
          album(*),
          playlist(*)`)
        .order('rated_at', { ascending: false });

      setMyReviews(myData || []);
      setRandomReviews(randomData || []);
      
    };

    fetchPlaylistsWithSongs();
    fetchUserData();
    fetchReviews();
    fetchAlbumsDB(albumPage);
    fetchAlbumCount();
  }, [albumPage]);

  const fetchAlbumsDB = async (page) => {
    const start = (page - 1) * albumsPerPage;
    const end = start + albumsPerPage - 1;

    const { data: albums } = await supabase
      .from('album')
      .select('*')
      .order('release_date', { ascending: false })
      .range(start, end);

    setAlbumsDB(albums || []);
  };

  const fetchAlbumCount = async () => {
    const { count } = await supabase
      .from('album')
      .select('*', { count: 'exact', head: true });

    setTotalAlbums(count || 0);
  };

  const fetchSongsForAlbum = async (albumId) => {
    if (expandedAlbumId === albumId) {
      setExpandedAlbumId(null);
      setSongsDB([]);
      return;
    }

    const { data: songs } = await supabase
      .from('song')
      .select('*')
      .eq('album_id', albumId);

    setSongsDB(songs || []);
    setExpandedAlbumId(albumId);
  };

  const handleReviewRedirect = (entityType, entityId, entityName, album_id, song_id, playlist_id) => {
    navigate('/review', { state: { entityType, entityId, entityName, album_id, song_id, playlist_id } });
  };

  const totalPages = Math.ceil(totalAlbums / albumsPerPage);

  return (
    <Container className="mt-5">
      <h2>Dashboard</h2>
      <Card className="mb-3 p-3">
        <h4>Welcome back!</h4>
        
        <Button onClick={handleLogout} variant="secondary">Logout</Button>
      </Card>

      <h4>Your Reviews</h4>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Type</th>
            <th>Title</th>
            <th>Rating</th>
            <th>Comment</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {myReviews.map((review) => (
            <tr key={review.rating_id}>
              <td>{review.entity_type}</td>
              <td>
                {[
                  review.album?.title,
                  review.song?.title,
                  review.playlist?.title,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </td>
              <td>{review.rating_value}</td>
              <td>{review.comment}</td>
              <td>{new Date(review.rated_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      <h4>Recent Reviews</h4>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Type</th>
            <th>Title</th>
            <th>Rating</th>
            <th>Comment</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {randomReviews.map((review) => (
            <tr key={review.rating_id}>
              <td>{review.entity_type}</td>
              <td>
                {[
                  review.album?.title,
                  review.song?.title,
                  review.playlist?.title,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </td>
              <td>{review.rating_value}</td>
              <td>{review.comment}</td>
              <td>{new Date(review.rated_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      <h4>View Albums</h4>
      <Table>
        <thead>
          <tr>
            <th>Album Title</th>
            <th>Artist</th>
            <th>Release Date</th>
            <th>Album Rating</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {albumsDB.map((album) => (
            <React.Fragment key={album.id}>
              <tr>
                <td>{album.title}</td>
                <td>{album.artist}</td>
                <td>{album.release_date}</td>
                <td>{album.album_rating}</td>
                <td>
                  <Button onClick={() => fetchSongsForAlbum(album.album_id)} className="me-2">
                    {expandedAlbumId === album.album_id ? 'Hide Songs' : 'View Songs!'}
                  </Button>
                  <Button
                    type="button"
                    className="btn btn-success"
                    onClick={() => handleReviewRedirect('album', album.album_id, album.title, album.album_id, null, null)}
                  >
                    Submit a Review!
                  </Button>
                </td>
              </tr>
              {expandedAlbumId === album.album_id && (
                <tr>
                  <td colSpan="5">
                    <Table size="sm" bordered hover>
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Artist</th>
                          <th>Genre</th>
                          <th>Duration</th>
                          <th>Release Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {songsDB.map((song) => (
                          <tr key={song.song_id}>
                            <td>{song.title}</td>
                            <td>{song.artist}</td>
                            <td>{song.genre}</td>
                            <td>{song.duration}</td>
                            <td>{song.release_date}</td>
                            <td>
                              <Button
                                type="button"
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleReviewRedirect('song', song.song_id, song.title, song.album_id, song.song_id, null)}
                              >
                                Review Song
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </Table>
      <Pagination>
    {[...Array(totalPages)].map((_, index) => (
      <Pagination.Item
        key={index + 1}
        active={index + 1 === albumPage}
        onClick={() => setAlbumPage(index + 1)}
      >
        {index + 1}
      </Pagination.Item>
    ))}
  </Pagination>

      <h3 className="mt-4">Playlists</h3>
      <div>
          {playlists.map((playlist) => (
            <div key={playlist.playlist_id} className="mb-4">
            <h5>{playlist.name}</h5>
            <p><a href={playlist.link} target="_blank" rel="noopener noreferrer">{playlist.link}</a></p>
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Artist</th>
                  <th>Genre</th>
                  <th>Duration</th>
                </tr>
            </thead>
            <tbody>
            {playlist.songs.map((song, idx) => (
            <tr key={idx}>
              <td>{song.title}</td>
              <td>{song.artist}</td>
              <td>{song.genre}</td>
              <td>{song.duration} sec</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ))}
</div>

      
    </Container>
  );
}

export default Dashboard;