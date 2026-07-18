import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from 'react-bootstrap';
import '../i18n/config';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <Dropdown className="ms-3">
      <Dropdown.Toggle
        variant="light"
        id="language-dropdown"
        className="d-flex align-items-center"
      >
        {i18n.language.toUpperCase()}
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Item
          active={i18n.language === 'en'}
          onClick={() => handleLanguageChange('en')}
        >
          🇬🇧 English
        </Dropdown.Item>
        <Dropdown.Item
          active={i18n.language === 'hi'}
          onClick={() => handleLanguageChange('hi')}
        >
          🇮🇳 हिंदी
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default LanguageSwitcher;
