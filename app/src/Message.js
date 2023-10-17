import React, { useState, useEffect } from 'react';
import { Card, Container } from 'react-bootstrap';

function Message(props) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(props.apiEndpoint+'quote', {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: props.authToken
            }
        }) 
      .then(response => response.json())
      .then(data => {
        setData(data); 
      })
      .catch(error => {
        console.error('Error:', error);
        setData('An error occurred'); 
      });
  }, []);

  return data? (
    <Container>
      <Card>
        <Card.Body style={{ fontFamily: 'Georgia, serif', fontSize: '18px' }}>
          {data.message}
        </Card.Body>
      </Card>
    </Container>
  ) : null;
}

export default Message;
