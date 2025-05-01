import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import { supabase } from '../supabaseClient';

function ReviewForm() {
  const navigate = useNavigate();
  const location = useLocation();

  const [entityType, setEntityType] = useState(location.state?.entityType || 'song');
  const [entityId, setEntityId] = useState(location.state?.entityId?.toString() || '');
  const [entityName, setEntityName] = useState(location.state?.entityName || '');
  const [album_id] = useState(location.state?.album_id || '');
  const [song_id] = useState(location.state?.song_id || '');
  const [playlist_id] = useState(location.state?.playlist_id || '');
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewUserId, setReviewUserId] = useState(Number(''));
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError('You must be logged in to submit a review.');
      return;
    }

    setReviewUserId(2); // Replace with user.id in a real scenario
    const numericAlbumId = album_id ? parseInt(album_id) : null;
    const numericSongId = song_id ? parseInt(song_id) : null;
    const numericPlaylistId = playlist_id ? parseInt(playlist_id) : null;

    const { error: insertError } = await supabase.from('rating').insert([
      {
        user_id: 2,
        entity_type: entityType,
        entity_id: parseInt(entityId),
        rating_value: ratingValue,
        comment,
        album_id: numericAlbumId,
        song_id: numericSongId,
        playlist_id: numericPlaylistId,
        rated_at: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      setError('Error submitting review: ' + insertError.message);
      return;
    }

    // Recalculate and update average rating for entity
    let targetTable = '';
    let targetId = null;
    let targetColumn = '';

    if (entityType === 'album') {
      targetTable = 'album';
      targetId = numericAlbumId;
      targetColumn = 'album_id';
    } else if (entityType === 'song') {
      targetTable = 'song';
      targetId = numericSongId;
      targetColumn = 'song_id';
    } else if (entityType === 'playlist') {
      targetTable = 'playlist';
      targetId = numericPlaylistId;
      targetColumn = 'playlist_id';
    }

    if (targetTable && targetId) {
      const { data: ratings, error: fetchError } = await supabase
        .from('rating')
        .select('rating_value')
        .eq(targetColumn, targetId);

      if (!fetchError && ratings.length > 0) {
        const total = ratings.reduce((sum, r) => sum + r.rating_value, 0);
        const avg = total / ratings.length;

        const { error: updateError } = await supabase
          .from(targetTable)
          .update({ [`${targetTable}_rating`]: avg })
          .eq(targetColumn, targetId);

        if (updateError) {
          console.error(updateError);
          setError('Review saved, but failed to update rating.');
          return;
        }
      }
    }

    setSuccess('Review submitted and rating updated!');
    setComment('');
    if (!location.state?.entityType) setEntityType('song');
    if (!location.state?.entityId) setEntityId('');
    setRatingValue(5);
  };

  return (
    <Container className="mt-5">
      <h2>Submit a Review</h2>

      {entityName && (
        <Alert variant="info">
          You are reviewing: <strong>{entityName}</strong>
        </Alert>
      )}
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Entity Type</Form.Label>
          <Form.Select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            disabled={!!location.state?.entityType}
          >
            <option value="song">Song</option>
            <option value="album">Album</option>
            <option value="playlist">Playlist</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Entity ID</Form.Label>
          <Form.Control
            type="number"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            disabled={!!location.state?.entityId}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Rating (1 to 5)</Form.Label>
          <Form.Control
            type="number"
            min="1"
            max="5"
            value={ratingValue}
            onChange={(e) => setRatingValue(parseInt(e.target.value))}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Comment</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </Form.Group>

        <Button variant="primary" type="submit">
          Submit Review
        </Button>
        <Button variant="secondary" className="ms-2" onClick={() => navigate('/dashboard')}>
          Cancel
        </Button>
      </Form>
    </Container>
  );
}

export default ReviewForm;

