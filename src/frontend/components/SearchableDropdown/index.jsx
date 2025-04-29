import React, { useEffect, useState } from 'react';
import { List, ListItem, Text, Box, Inline, Textfield, Tag, Button } from '@forge/react';

const SearchableDropdown = ({ options = [], selected = [], onSelect, label }) => {
  // Garantizamos que options y selected sean arrays
  const optionsArray = Array.isArray(options) ? options : [];
  const selectedArray = Array.isArray(selected) ? selected : [];

  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Se filtran las opciones en función del searchTerm y de las opciones ya seleccionadas
  const filteredOptions = optionsArray.filter(opt => {
    if (!opt.title) return false;
    return (
      opt.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedArray.includes(opt.id)
    );
  });

  return (
    <Box marginBottom="medium">
      <Text>{label}</Text>
      <Box position="relative">
        <Textfield
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {filteredOptions.length > 0 && (
          <Box
            position="absolute"
            background="neutral"
            border="standard"
            borderRadius="normal"
            width="100%"
            zIndex="dropdown"
            marginTop="xsmall"
          >
            <List>
              {filteredOptions.map(option => (
                <Button
                  key={option.id}
                  onClick={() => {
                    onSelect([...selectedArray, option.id]);
                    setSearchTerm('');
                    setIsOpen(false);
                  }}
                  hoverBackground="neutralHovered"
                >
                  <Text>{option.title}</Text>
                </Button>
              ))}
            </List>
          </Box>
        )}
      </Box>
      <Inline gap="xsmall" marginTop="small">
        {selectedArray.map(id => {
          const req = optionsArray.find(o => o.id === id);
          return (
            req && (
              <Tag
                key={id}
                text={req.title}
                onAfterRemoveAction={() =>
                  onSelect(selectedArray.filter(item => item !== id))
                }
                isRemovable
              />
            )
          );
        })}
      </Inline>
    </Box>
  );
};

export default SearchableDropdown;
