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
    
    setReviewUserId(2);
    console.log(reviewUserId);
    const { error: insertError } = await supabase.from('rating').insert([
      {
        user_id: 2,
        entity_type: entityType,
        entity_id: parseInt(entityId),
        rating_value: ratingValue,
        comment,
        album_id: parseInt(album_id),
        song_id: parseInt(song_id),
        playlist_id: parseInt(playlist_id),
        rated_at: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      setError('Error submitting review: ' + insertError.message);
    } else {
      setSuccess('Review submitted successfully!');
      setComment('');
      if (!location.state?.entityType) setEntityType('song');
      if (!location.state?.entityId) setEntityId('');
      setRatingValue(5);
    }
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
          <Form.Label>Rating (1 to 10)</Form.Label>
          <Form.Control
            type="number"
            min="1"
            max="10"
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

