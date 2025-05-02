import React, { useState } from 'react';
import { List, Text, Box, Inline, Textfield, Tag, Button } from '@forge/react';

/**
 * Component to display a searchable dropdown list of requirements
 * It allows searching for options by title and selecting them.
 */
const SearchableDropdown = ({ options = [], selected = [], onSelect, label }) => {
  const optionsArray = Array.isArray(options) ? options : [];
  const selectedArray = Array.isArray(selected) ? selected : [];

  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Filter options based on the search term and selected items
  // It checks if the title of the option includes the search term and if the option is not already selected
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
