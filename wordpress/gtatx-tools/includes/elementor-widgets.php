<?php
/**
 * Elementor widgets for the blog blocks that are lists: Facts, Steps and
 * Table. Each has an "Add item" list in Elementor's left panel, so staff
 * change how many facts, steps, columns and rows there are, and type the
 * text, without touching layout. The look comes from css/blog.css (Figma
 * "Article/blog Master template"). They appear in Elementor under
 * "GetThereATX".
 *
 * Loaded by gtatx-tools.php inside the elementor/widgets/register hook.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Elementor\Controls_Manager;
use Elementor\Repeater;
use Elementor\Widget_Base;

abstract class GTATX_Widget extends Widget_Base {
	public function get_categories() {
		return array( 'gtatx' );
	}

	public function get_style_depends(): array {
		return array( 'gtatx-blog' );
	}

	/** One plain-text line per item; Elementor shows it on each row of the list. */
	protected function list_control( $name, $label, Repeater $repeater, $defaults, $title_field, $button = 'Add item' ) {
		$this->add_control(
			$name,
			array(
				'label'       => $label,
				'type'        => Controls_Manager::REPEATER,
				'fields'      => $repeater->get_controls(),
				'default'     => $defaults,
				'title_field' => $title_field,
				'prevent_empty' => true,
				'button_text' => $button,
			)
		);
	}
}

/** Figma facts strip: label / value pairs, three to a row (more start a new row). */
class GTATX_Facts_Widget extends GTATX_Widget {
	public function get_name() {
		return 'gtatx-facts';
	}

	public function get_title() {
		return 'Facts strip';
	}

	public function get_icon() {
		return 'eicon-info-box';
	}

	protected function register_controls() {
		$this->start_controls_section( 'content', array( 'label' => 'Facts' ) );
		$r = new Repeater();
		$r->add_control( 'label', array( 'label' => 'Label', 'type' => Controls_Manager::TEXT, 'default' => 'Hours', 'label_block' => true ) );
		$r->add_control( 'value', array( 'label' => 'Value', 'type' => Controls_Manager::TEXT, 'default' => 'Open 24/7', 'label_block' => true ) );
		$this->list_control(
			'facts',
			'Facts (three to a row; add more for a second row)',
			$r,
			array(
				array( 'label' => 'Stations', 'value' => '75+ across Austin' ),
				array( 'label' => 'Hours', 'value' => 'Open 24/7' ),
				array( 'label' => 'Bikes', 'value' => '100% electric' ),
			),
			'{{{ label }}}: {{{ value }}}',
			'Add fact'
		);
		$this->end_controls_section();
	}

	protected function render() {
		echo gtatx_facts_html( array_map( fn( $f ) => array( 'label' => $f['label'], 'details' => $f['value'] ), (array) $this->get_settings_for_display( 'facts' ) ) ); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped in gtatx_facts_html().
	}
}

/** Figma "Article/Step": numbered squares (numbers are automatic), a title and the text. */
class GTATX_Steps_Widget extends GTATX_Widget {
	public function get_name() {
		return 'gtatx-steps';
	}

	public function get_title() {
		return 'Steps';
	}

	public function get_icon() {
		return 'eicon-number-field';
	}

	protected function register_controls() {
		$this->start_controls_section( 'content', array( 'label' => 'Steps' ) );
		$r = new Repeater();
		$r->add_control( 'title', array( 'label' => 'Step title', 'type' => Controls_Manager::TEXT, 'default' => 'Find a station', 'label_block' => true ) );
		$r->add_control( 'text', array( 'label' => 'What to do', 'type' => Controls_Manager::TEXTAREA, 'rows' => 3, 'default' => 'Open the map or app to see nearby bikes and open docks.' ) );
		$this->list_control(
			'steps',
			'Steps (numbered automatically; drag to reorder)',
			$r,
			array(
				array( 'title' => 'Find a station', 'text' => 'Open the map or app to see nearby bikes and open docks.' ),
				array( 'title' => 'Unlock a bike', 'text' => 'Scan the code or enter your account details at the dock.' ),
				array( 'title' => 'Ride to your stop', 'text' => 'Use bike lanes and trails when you can, and follow traffic signals.' ),
				array( 'title' => 'Return it', 'text' => 'Dock the bike at any open station and check that it locked.' ),
			),
			'{{{ title }}}',
			'Add step'
		);
		$this->end_controls_section();
	}

	protected function render() {
		echo gtatx_steps_html( (array) $this->get_settings_for_display( 'steps' ) ); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped in gtatx_steps_html().
	}
}

/** Figma "Article/Table": pick 2–4 columns, name them, add rows. The first column is bold. */
class GTATX_Table_Widget extends GTATX_Widget {
	const MAX_COLUMNS = 4; // more won't fit on a phone

	public function get_name() {
		return 'gtatx-table';
	}

	public function get_title() {
		return 'Table';
	}

	public function get_icon() {
		return 'eicon-table';
	}

	protected function register_controls() {
		$this->start_controls_section( 'content', array( 'label' => 'Table' ) );
		$this->add_control(
			'columns',
			array(
				'label'   => 'Number of columns',
				'type'    => Controls_Manager::SELECT,
				'options' => array( '2' => '2', '3' => '3', '4' => '4' ),
				'default' => '3',
			)
		);
		$names = array( 'Column one', 'Column two', 'Column three', 'Column four' );
		for ( $i = 1; $i <= self::MAX_COLUMNS; $i++ ) {
			$this->add_control(
				"heading_$i",
				array(
					'label'     => "Column $i heading",
					'type'      => Controls_Manager::TEXT,
					'default'   => $names[ $i - 1 ],
					'condition' => array( 'columns' => array_map( 'strval', range( max( 2, $i ), self::MAX_COLUMNS ) ) ),
				)
			);
		}
		$r = new Repeater();
		for ( $i = 1; $i <= self::MAX_COLUMNS; $i++ ) {
			$r->add_control(
				"cell_$i",
				array(
					'label'       => 1 === $i ? 'Column 1 (row label, bold)' : "Column $i" . ( $i > 2 ? ' (if the table has that many)' : '' ),
					'type'        => Controls_Manager::TEXT,
					'default'     => 1 === $i ? 'Row label' : 'Detail text',
					'label_block' => true,
				)
			);
		}
		$this->list_control(
			'rows',
			'Rows',
			$r,
			array_fill( 0, 3, array( 'cell_1' => 'Row label', 'cell_2' => 'Detail text', 'cell_3' => 'Detail text', 'cell_4' => '' ) ),
			'{{{ cell_1 }}}',
			'Add row'
		);
		$this->end_controls_section();
	}

	protected function render() {
		$s     = $this->get_settings_for_display();
		$count = max( 2, min( self::MAX_COLUMNS, (int) $s['columns'] ) );
		$head  = array();
		for ( $i = 1; $i <= $count; $i++ ) {
			$head[] = (string) $s[ "heading_$i" ];
		}
		$rows = array();
		foreach ( (array) $s['rows'] as $row ) {
			$cells = array();
			for ( $i = 1; $i <= $count; $i++ ) {
				$cells[] = (string) ( $row[ "cell_$i" ] ?? '' );
			}
			$rows[] = $cells;
		}
		echo gtatx_table_html( $head, $rows ); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped in gtatx_table_html().
	}
}
